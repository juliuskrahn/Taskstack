""" Write texts from taskstack/app/templating/text/lexicons.py to txt file for easy review """


import importlib.util
import os
import sys
import pathlib


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE_PATH = pathlib.Path(os.path.dirname(os.path.abspath(__file__)))

OUTPUT_DIR = BASE_PATH / "output/write_texts_to_file"


def main():
    lexicons = load_module("lexicons", BASE_PATH / "../app/templating/text/lexicons.py")

    if not os.path.isdir(OUTPUT_DIR):
        if not os.path.isdir(OUTPUT_DIR / ".."):
            os.mkdir("output")
        os.mkdir(OUTPUT_DIR)

    translations_grouped_by_lang = {}

    for attr in lexicons.__dict__.values():
        if isinstance(attr, dict) and "__name__" not in attr:  # make sure attr is "lexicon dict"
            # don't implement a language called '__name__'
            # or declare any other non "lexicon dict" dict in text/lexicons.py

            for lang in attr.keys():
                if lang not in translations_grouped_by_lang:
                    translations_grouped_by_lang[lang] = f"language: {lang}\n================================\n"

                for translation in attr[lang].values():
                    translations_grouped_by_lang[lang] += f"{translation}\n"

    with open(f"{OUTPUT_DIR}/texts.txt", "w") as file:
        for string in translations_grouped_by_lang.values():
            file.write(f"{string}\n\n")


if __name__ == '__main__':
    main()
