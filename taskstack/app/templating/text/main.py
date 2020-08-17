from functools import wraps
from app.templating.text import lexicons
from app.helpers import get_lang


def get_lexicon_and_lang(name):
    lang = get_lang()
    try:
        if isinstance(name, list):
            name = name[0]
        name = name.replace(".", "_").replace("/", "_")
        name_bound_lexicons = getattr(lexicons, name)
    except AttributeError:
        return {}, lang
    return name_bound_lexicons[lang], lang


def get_lexicon_and_lang_for_templating_context_wrapper(render_template_func):
    @wraps(render_template_func)
    def wrapped(*args, **kwargs):
        kwargs["lex"], kwargs["lang"] = get_lexicon_and_lang(*args)
        return render_template_func(*args, **kwargs)
    return wrapped
