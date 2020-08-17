"""
(requires request context!)


> Use in view function
======================

create lexicon dict (app/templating/text/lexicons.py)

___________________________________________
from app.templating.text import get_lexicon
lex, lang = get_lexicon_and_lang(<name>)
print(lex["hello"])
____________________________________________


> Use in template (always import render_template func from app!)
================================================================

create lexicon dict (app/templating/text/lexicons.py);
if the template extends another template that requires its own translations:
    create the lexicon dict with the get_extended_lexicon_dict func;
name should be the name of the template file (replace dots and forward slashes with underscores)

__________________
{{ lex["hello"] }}
__________________


for lexicon dict creation see example (app/templating/text/lexicons.py)
"""

from app.templating.text.main import get_lexicon_and_lang, get_lexicon_and_lang_for_templating_context_wrapper
