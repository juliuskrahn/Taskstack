import os
import pathlib
from flask import request
from app import app, s3_cli


# request helpers
# ===============


def get_lang():
    lang_set_in_cookies = request.cookies.get("lang")
    if lang_set_in_cookies == "de" or (request.accept_languages.best_match(["de", "en"]) == "de"
                                       and not lang_set_in_cookies == "en"):
        return "de"
    return "en"


# validation helpers
# ==================


def invalid_names():
    names = []
    for rule in app.url_map.iter_rules():
        route_str = str(rule)
        start = 1
        while start:
            end = route_str[start:].find("/")
            name = route_str[start:] if end == -1 else route_str[start:end + 1]
            if len(name) > 0 and name[0] != "<":
                names.append(name)
            start = 0 if end == -1 else end + 2
    return names


# s3 helpers
# ==========


def obj_exists_in_s3_bucket(bucket, obj):
    res = s3_cli.list_objects_v2(Bucket=bucket, Prefix=obj)
    if res.get("Contents"):
        return True
    return False


def split_s3_obj_url(url):
    """ assumes:
           - that bucket name does not contain: '.amazonaws.com' or '/'
           - that bucket url follows this pattern: '{bucket name}.s3.{region}.amazonaws.com' """

    bucket_name = url[
                  :len(url[:url.find(".amazonaws.com")][::-1]) - url[:url.find(".amazonaws.com")][::-1].find(".") - 4]
    if "/" in bucket_name:
        bucket_name = bucket_name[len(bucket_name) - bucket_name[::-1].find("/"):]
    obj_name = url[url.find(".amazonaws.com") + len(".amazonaws.com"):]
    if obj_name:
        obj_name = obj_name[1:]
    return bucket_name, obj_name


# misc helpers
# ============


def print_in_light_red(txt):
    print(f"\033[31m{txt}\033[00m")
