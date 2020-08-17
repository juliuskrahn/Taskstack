""" Production environment setup:
 - setup static files
 - setup template files """


import os
import sys
import importlib.util
import shutil
import pathlib
import subprocess
import boto3
import gzip
import hashlib
import time


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE_PATH = pathlib.Path(os.path.dirname(os.path.abspath(__file__)))


env = load_module("env_loader", BASE_PATH / "../utils/env_loader/main.py").load()


get_insert_replace = load_module("get_insert_replace", BASE_PATH / "../utils/get_insert_replace/__init__.py")


TEMPLATES_DIR = BASE_PATH / "../app/templates"
TEMPLATES_DIR_PRODUCTION = BASE_PATH / "../app/templates_production"
STATIC_DIR = BASE_PATH / "../app/static"

STATIC_BUCKET = "taskstack-static"
STATIC_BUCKET_URL = f"https://{STATIC_BUCKET}.s3.eu-central-1.amazonaws.com"

OUTPUT_PATHS = {
    "~": BASE_PATH / "output",
    "/": BASE_PATH / "output/production_env_setup",
    "/temp": BASE_PATH / "output/production_env_setup/temp",
    "/temp/css": BASE_PATH / "output/production_env_setup/temp/css",
    "/temp/js": BASE_PATH / "output/production_env_setup/temp/js"
}


s3_cli = boto3.client("s3",
                      aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
                      aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
                      region_name=env["AWS_DEFAULT_REGION"])


def collect_paths_from_dir_and_opt_recreate_dir_structure(dir_to_collect_from,
                                                          recreate_dir_structure_path=None,
                                                          ignore_direct_subdir_of_base_dir_func=None,
                                                          base_dir=None):
    """ Collects all paths from the given dir and sub-dirs.
    :param dir_to_collect_from: pathlib.Path -> path of the dir to collect from
    :param recreate_dir_structure_path: pathlib.Path -> path of the dir where you want sub-dirs of the
        <dir_to_collect_from> to be recreated
    :param ignore_direct_subdir_of_base_dir_func: Callable -> takes the name of a direct sub-dir of the
        <dir_to_collect_from> as parameter and returns a bool: True => ignore | False => don't ignore
    :param base_dir: !!! don't set this parameter (used internally) !!!
    :return: List[str] -> list of collected paths
    """

    if base_dir is None:
        base_dir = dir_to_collect_from

    paths = []

    for entry in os.listdir(dir_to_collect_from):
        path = dir_to_collect_from / entry

        if os.path.isdir(path):

            if base_dir == dir_to_collect_from and callable(ignore_direct_subdir_of_base_dir_func) and \
                    ignore_direct_subdir_of_base_dir_func(entry):
                continue

            if recreate_dir_structure_path is not None:
                try:
                    os.mkdir(recreate_dir_structure_path /
                             str(path)[str(path).find(str(base_dir)) + len(str(base_dir)) + 1:])
                except FileExistsError:
                    pass

            paths = paths + \
                collect_paths_from_dir_and_opt_recreate_dir_structure(path,
                                                                      recreate_dir_structure_path=
                                                                      recreate_dir_structure_path,
                                                                      base_dir=base_dir)

        else:
            paths.append(path)

    return paths


def get_static_bucket_files():
    """ Collects info about files in the STATIC_BUCKET.
    :return: Dict[Dict] -> {<corresponding static file path>: {"Key": <obj key>,
                                                               "Hash": <md5 hash before compression>}, ...
                           }
    """

    print(f"collect info about '{STATIC_BUCKET}' s3 bucket")

    # STATIC_BUCKET files
    #   - Key: <path of corresponding local file (relative to static dir)> | <md5 hash before compression>
    #   - TagSet: name=<path of corresponding local file (relative to static dir)> &
    #             hash=<md5 hash before compression>

    files = {}
    paginator = s3_cli.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=STATIC_BUCKET):
        try:
            contents = page["Contents"]
        except KeyError:
            break
        for obj in contents:
            static_path = None
            file_hash = None
            for tag in s3_cli.get_object_tagging(Bucket=STATIC_BUCKET, Key=obj["Key"])["TagSet"]:
                if tag["Key"] == "name":
                    static_path = tag["Value"]
                if tag["Key"] == "hash":
                    file_hash = tag["Value"]
            if static_path is not None and file_hash is not None:
                files[static_path] = {"Key": obj["Key"], "Hash": file_hash}
    return files


def get_file_md5_hash(file_path):
    """ Hashes a file.
    :param file_path: Union[str, pathlib.Path] -> path of the file to hash
    :return: str -> file hash
    """

    etag = hashlib.md5()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            etag.update(byte_block)
    return etag.hexdigest()


def get_file_mime_type(file_name):
    """ Returns mime-type of a file based on its file extension.
    :param file_name: str -> name of the file
    :return: str -> mime-type of the file
    """

    mim_type = {
        "png": "image/png",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "jfif": "image/jpeg",
        "css": "text/css",
        "js": "text/javascript",
        "ico": "image/vnd.microsoft.icon",
        "svg": "image/svg+xml",
        "gif": "image/gif"
    }

    file_ext = file_name[len(file_name) - file_name[::-1].find("."):].lower()

    try:
        return mim_type[file_ext]
    except KeyError:
        raise ValueError(f"Unknown file extension: '{file_ext}'. You can add this file extension to "
                         f"tools/production_env_setup.py - get_file_mime_type")


def minify_gzip_and_get_css_and_js_files():
    """ 'Minifys' and 'gzips' css/ js files (write to output/temp) and returns info about those files.
    :return: Dict[Dict] -> {<path relative to static dir>: {
                                                            "Path": <path relative to cwd>,
                                                            "Hash": <md5 hash of file before compression>,
                                                            "Name": <corresponding file name in s3 bucket>
                                                           }, ...
                           }
    """

    print("minify and gzip css and js files")

    def path_relative_to_static_css_or_js_dir(path):
        path_str = str(path)
        css_dir_str = str(STATIC_DIR / "css")
        js_dir_str = str(STATIC_DIR / "js")

        if path_str.find(css_dir_str) != -1:
            trim = css_dir_str
        elif path_str.find(js_dir_str) != -1:
            trim = js_dir_str
        else:
            raise ValueError("Invalid path")

        return pathlib.Path(path_str[path_str.find(trim) + len(trim) + 1:])

    files = {}

    def _(in_dir, out_dir):

        for i, path in enumerate(collect_paths_from_dir_and_opt_recreate_dir_structure(in_dir)):
            in_path = path
            name = path_relative_to_static_css_or_js_dir(path)
            out_path = out_dir / name

            if path.suffix == ".css":
                cmd = f"java -jar {BASE_PATH / '3rd_party/yuicompressor.jar'} " \
                      f"{in_path} " \
                      f"-o {out_path} " \
                      f"--charset utf-8"
                static_path = "css/" + str(name)

            elif path.suffix == ".js":
                cmd = f"java -jar {BASE_PATH / '3rd_party/google_closure_compiler.jar'} " \
                      f"--compilation_level SIMPLE_OPTIMIZATIONS " \
                      f"--js {in_path} " \
                      f"--js_output_file {out_path}"

                static_path = "js/" + str(name)

            else:
                raise ValueError("Invalid path")

            if ".min." in str(path_relative_to_static_css_or_js_dir(path)):
                shutil.copy2(path, out_dir / path_relative_to_static_css_or_js_dir(path))

            else:
                process = subprocess.Popen(cmd, shell=True,
                                           stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                           universal_newlines=True)

                stdout, stderr = process.communicate()

                if process.returncode != 0:
                    raise ChildProcessError(stderr + "\nThis error could be caused by using Windows.")

            file_hash = get_file_md5_hash(in_path)

            files[static_path] = {"Path": str(out_path),
                                  "Hash": file_hash,
                                  "Name": file_hash}

            with open(out_path, 'rb') as f_in:
                f_in_content = f_in.read()
            with gzip.open(out_path, 'wb') as f_out:
                f_out.write(f_in_content)

    _(STATIC_DIR / "css", OUTPUT_PATHS["/temp/css"])
    _(STATIC_DIR / "js", OUTPUT_PATHS["/temp/js"])

    return files


def gzip_and_get_other_static_files():
    """ 'Gzips' static non css/ js files (write to output/temp) and returns info about those files.
    :return: Dict[Dict] -> {<path relative to static dir>: {
                                                            "Path": <path relative to cwd>,
                                                            "Hash": <md5 hash of file before compression>,
                                                            "Name": <corresponding file name in s3 bucket>
                                                           }, ...
                           }
    """

    print("gzip non css/ js static files")

    def path_relative_to_static_dir(_path):
        path_str = str(_path)
        return pathlib.Path(path_str[path_str.find(str(STATIC_DIR)) + len(str(STATIC_DIR)) + 1:])

    files = {}

    paths = collect_paths_from_dir_and_opt_recreate_dir_structure(STATIC_DIR, OUTPUT_PATHS["/temp"],
                                                                  lambda static_subdir:
                                                                  static_subdir == "css" or
                                                                  static_subdir == "js")

    for i, path in \
            enumerate(paths):
        static_path = str(pathlib.PurePosixPath(path_relative_to_static_dir(path)))

        files[static_path] = {"Path": str(OUTPUT_PATHS["/temp"] / static_path),
                              "Hash": get_file_md5_hash(path),
                              "Name": static_path}

        with open(path, 'rb') as f_in:
            f_in_content = f_in.read()
        with gzip.open(OUTPUT_PATHS["/temp"] / static_path, 'wb') as f_out:
            f_out.write(f_in_content)

    return files


def sync_static_bucket(not_processed_static_files):
    """ Syncs the STATIC_BUCKET with the local static files.
    :param not_processed_static_files: Dict[Dict] -> return of minify_gzip_and_get_css_and_js_files /
        gzip_and_get_other_static_files
    """

    print(f"sync '{STATIC_BUCKET}' s3 bucket with local static files")

    not_processed_static_bucket_files = get_static_bucket_files()

    upload_count = 0
    re_upload_count = 0
    delete_count = 0

    for static_path, file in not_processed_static_files.items():

        if static_path in not_processed_static_bucket_files:

            if file["Hash"] == not_processed_static_bucket_files[static_path]["Hash"]:
                del not_processed_static_bucket_files[static_path]
                continue

            else:
                s3_cli.delete_object(Bucket=STATIC_BUCKET, Key=not_processed_static_bucket_files[static_path]["Key"])
                delete_count += 1
                re_upload_count += 1
                del not_processed_static_bucket_files[static_path]

        s3_cli.upload_file(file["Path"],
                           STATIC_BUCKET,
                           file["Name"],
                           ExtraArgs={"ContentType": get_file_mime_type(static_path),
                                      "ContentEncoding": "gzip",
                                      "Tagging": f"name={static_path}&hash={file['Hash']}",
                                      'CacheControl': 'max-age: 31536000',  # = 1 year
                                      'ACL': 'public-read'})
        upload_count += 1

    for name, file in not_processed_static_bucket_files.items():
        s3_cli.delete_object(Bucket=STATIC_BUCKET, Key=file["Key"])
        delete_count += 1

    print(f"synced '{STATIC_BUCKET}' s3 bucket with local static files:\n"
          f"\t- uploaded [{upload_count}] files ([{re_upload_count}] for re-upload)\n"
          f"\t- deleted [{delete_count}] files ([{re_upload_count}] for re-upload)\n"
          f"\t- re-uploaded [{re_upload_count}] files")


def setup_templates(static_files):
    """ Write templates from TEMPLATES_DIR to TEMPLATES_DIR_PRODUCTION >> replace <static_url> func calls with the
    corresponding STATIC_BUCKET URL.
    :param static_files: Dict[Dict] -> return of minify_gzip_and_get_css_and_js_files /
        gzip_and_get_other_static_files
    """

    print("setup templates")

    def path_relative_to_templates_dir(_path):
        path_str = str(_path)
        return pathlib.Path(path_str[path_str.find(str(TEMPLATES_DIR)) + len(str(TEMPLATES_DIR)) + 1:])

    shutil.rmtree(TEMPLATES_DIR_PRODUCTION, ignore_errors=True)
    time.sleep(.1)
    os.mkdir(TEMPLATES_DIR_PRODUCTION)

    templates_paths = collect_paths_from_dir_and_opt_recreate_dir_structure(TEMPLATES_DIR,
                                                                            TEMPLATES_DIR_PRODUCTION)

    marker_sequence_before = get_insert_replace.MarkerSequence(
        [get_insert_replace.Marker("{{"),
         get_insert_replace.OptionalRepeatableMarker(" "),
         get_insert_replace.Marker("static_url"),
         get_insert_replace.OptionalRepeatableMarker(" "),
         get_insert_replace.Marker("("),
         get_insert_replace.OptionalRepeatableMarker(" "),
         get_insert_replace.MultiplePossibleMarkers([get_insert_replace.Marker("'"),
                                                     get_insert_replace.Marker("\"")])])

    marker_sequence_after = get_insert_replace.MarkerSequence(
        [get_insert_replace.MultiplePossibleMarkers([get_insert_replace.Marker("'"),
                                                     get_insert_replace.Marker("\"")]),
         get_insert_replace.OptionalRepeatableMarker(" "),
         get_insert_replace.Marker(")"),
         get_insert_replace.OptionalRepeatableMarker(" "),
         get_insert_replace.Marker("}}")])

    def replace_static_url_func_call_with_corresponding_static_bucket_url(target_str, _, __):
        nonlocal path
        if target_str not in static_files:
            raise ValueError(f"Error in template: '{path}'. The path '{target_str}' does not exist in '{STATIC_DIR}'.")

        return f"\"{STATIC_BUCKET_URL}/{static_files[target_str]['Name']}\"", \
               get_insert_replace.REPLACE_TARGET_AND_MARKER_SEQUENCE

    replacer = get_insert_replace.Replacer([(marker_sequence_before, marker_sequence_after,
                                             replace_static_url_func_call_with_corresponding_static_bucket_url)])

    for i, path in enumerate(templates_paths):
        with open(path, "r") as template:
            content = replacer.replace(template.read())

        with open(TEMPLATES_DIR_PRODUCTION / path_relative_to_templates_dir(path), "w") as processed_template:
            processed_template.write(content)


def main():
    if env.get("FLASK_ENV") != "production":
        raise ValueError("Environment variable FLASK_ENV != 'production'")

    for path in OUTPUT_PATHS.values():
        os.mkdir(path)

    static_files = {**minify_gzip_and_get_css_and_js_files(),
                    **gzip_and_get_other_static_files()}

    sync_static_bucket(static_files)

    os.mkdir(TEMPLATES_DIR_PRODUCTION)

    setup_templates(static_files)

    shutil.rmtree(OUTPUT_PATHS["/"], ignore_errors=True)


if __name__ == '__main__':
    main()
