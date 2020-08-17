import os
import pathlib


def load():
    env = {}

    with open(pathlib.Path(os.path.dirname(os.path.abspath(__file__))) / "../../.env") as f:
        for line in f:
            if line.startswith('#'):
                continue
            key, value = line.strip().split('=', 1)
            env[key] = value

    return env
