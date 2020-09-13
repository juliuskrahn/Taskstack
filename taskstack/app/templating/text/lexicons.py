"""
> Example
=========

<name 1> = {
    <lang a>: {
        "hello world": "hello world"
    },
    <lang b>: {
        "hello world": "Hallo Welt"
    }
}

<name 2> = get_extended_lexicon_dict({
        <lang a>: {
            "apple": "apple"
        },
        <lang b>: {
            "apple": "Apfel"
        }
    },
    <name 1>)


every lexicon dict has to implement all languages that can be returned by the get_lang func (/app/helpers.py)
"""


# > helpers
# =========


def get_extended_lexicon_dict(dict_obj, dict_obj_to_extend=None):
    if dict_obj_to_extend:
        for lang in dict_obj.keys():
            for key, val in dict_obj_to_extend[lang].items():
                dict_obj[lang][key] = val
    return dict_obj


# > lexicons
# ==========

# templates/ view funcs

base_html_j2 = {
    "en": {
        "Taskstack_desc": "Taskstack is a Free and Open Source Kanban Project Management app. "
                          "Whether you work with a large team or just plan something on your own, "
                          "Taskstack is right for you.",

        "Signup": "Signup",
        "Login": "Login",
        "Privacy": "Privacy",
        "Imprint": "Imprint",
        "Help": "Help",
        "Language": "Language",
        "Contact": "Contact",
        "Account": "Account",

        "Logged in as": "Logged in as",
        "Your profile": "Your profile",
        "Settings": "Settings",
        "Logout": "Logout",

        "Make sure that": "Make sure that",
        "your browser supports javascript": "your browser supports javascript",
        "javascript is enabled": "javascript is enabled",

        "cookie_msg": 'Taskstack uses cookies. For further details, please read our <a href="/privacy">Privacy '
                      'Policy</a>.',

        "Reload": "Reload",

        "Connection lost": "Connection lost",
        "Try reloading the page.": "Try reloading the page.",

        # time
        "today": "today",
        "yesterday": "yesterday",
        "tomorrow": "tomorrow",
        "2 days ago": "2 days ago",
        "in 2 days": "in 2 days",
        "3 days ago": "3 days ago",
        "in 3 days": "in 3 days",
        "4 days ago": "4 days ago",
        "in 4 days": "in 4 days"
    },
    "de": {
        "Taskstack_desc": "Taskstack ist eine kostenlose und Open Source Kanban-Projekt-Management App. "
                          "Ob Sie Ihren nächsten Urlaub planen oder mit einem großen Team arbeiten, "
                          "Taskstack hilft Ihnen dabei.",

        "Signup": "Registrieren",
        "Login": "Anmelden",
        "Privacy": "Datenschutz",
        "Imprint": "Impressum",
        "Help": "Hilfe",
        "Language": "Sprache",
        "Contact": "Kontakt",
        "Account": "Konto",

        "Logged in as": "Angemeldet als",
        "Your profile": "Ihr Profil",
        "Settings": "Einstellungen",
        "Logout": "Abmelden",

        "Make sure that": "Stellen Sie sicher, dass",
        "your browser supports javascript": "Ihr Browser Javascript unterstützt",
        "javascript is enabled": "Javascript aktiviert ist",

        "cookie_msg": 'Taskstack benutzt Cookies. Lesen Sie unsere <a href="/privacy">Datenschutz Erklärung</a> für '
                      'mehr Details.',

        "Reload": "Neu laden",

        "Connection lost": "Verbindung zum Server unterbrochen",
        "Try reloading the page.": "Versuchen Sie die Seite neu zu laden.",

        # time
        "today": "Heute",
        "yesterday": "Gestern",
        "tomorrow": "Morgen",
        "2 days ago": "vor 2 Tagen",
        "in 2 days": "in 2 Tagen",
        "3 days ago": "vor 3 Tagen",
        "in 3 days": "in 3 Tagen",
        "4 days ago": "vor 4 Tagen",
        "in 4 days": "in 4 Tagen"
    }
}

base_light_html_j2 = {
    "en": {
        "Taskstack_desc": "Taskstack is a Free and Open Source Kanban Project Management app. "
                          "Whether you work with a large team or just plan something on your own, "
                          "Taskstack is right for you.",

        "Privacy": "Privacy",
        "Imprint": "Imprint",
        "Help": "Help",

        # no javascript modal
        "Make sure that": "Make sure that",
        "your browser supports javascript": "your browser supports javascript",
        "javascript is enabled": "javascript is enabled",

        "Reload": "Reload"
    },
    "de": {
        "Taskstack_desc": "Taskstack ist eine kostenlose und Open Source Kanban-Projekt-Management App. "
                          "Ob Sie Ihren nächsten Urlaub planen oder mit einem großen Team arbeiten, "
                          "Taskstack hilft Ihnen dabei.",

        "Privacy": "Datenschutz",
        "Imprint": "Impressum",
        "Help": "Hilfe",

        # no javascript modal
        "Make sure that": "Stellen Sie sicher, dass",
        "your browser supports javascript": "Ihr Browser Javascript unterstützt",
        "javascript is enabled": "Javascript aktiviert ist",

        "Reload": "Neu laden"
    }
}

privacy_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Use of cookies": "Use of cookies",
        "Taskstack uses cookies to authenticate users and to store system relevant data (like the selected language) "
        "locally. Cookies are not used for advertising purposes or to track you.":
        "Taskstack uses cookies to authenticate users and to store system relevant data (like the selected language) "
        "locally. Cookies are not used for advertising purposes or to track you.",
        "Your data": "Your data",
        "No data is passed on to third parties or is used for advertising purposes.":
        "No data is passed on to third parties or is used for advertising purposes.",
        "We do not intentionally collect personal information. Any personal information is the responsibility of the "
        "user. You can set who has access to your profile and your projects.":
        "We do not intentionally collect personal information. Any personal information is the responsibility of the "
        "user. You can set who has access to your profile and your projects.",
        "Uploaded files": "Uploaded files",
        "Uploaded files are stored with Amazon S3. The URLs we generate for these files are cryptographically "
        "unguessable, meaning that no one is going to be able to guess the URL for your file. However, if you share "
        "the URL for a Taskstack file, anyone with the URL will be able to see the file. Deleting a file in Taskstack "
        "removes it from Amazon S3.":
        "Uploaded files are stored with Amazon S3. The URLs we generate for these files are cryptographically "
        "unguessable, meaning that no one is going to be able to guess the URL for your file. However, if you share "
        "the URL for a Taskstack file, anyone with the URL will be able to see the file. Deleting a file in Taskstack "
        "removes it from Amazon S3."
    },
    "de": {
        "Use of cookies": "Cookies",
        "Taskstack uses cookies to authenticate users and to store system relevant data (like the selected language) "
        "locally. Cookies are not used for advertising purposes or to track you.":
        "Takstack verwendet Cookies, um Benutzer zu authentifizieren und System relevante Daten (wie z.B. die gewählte "
        "Sprache) lokal zu speichern. Cookies werden nicht für Werbezwecke oder Tracking genutzt.",
        "Your data": "Ihre Daten",
        "No data is passed on to third parties or is used for advertising purposes.":
        "Daten werden nicht an Dritte weitergegeben oder für Werbezwecke genutzt.",
        "We do not intentionally collect personal information. Any personal information is the responsibility of the "
        "user. You can set who has access to your profile and your projects.":
        "Persönliche Informationen werden nicht wissentlich gesammelt. Sie können festlegen wer Ihr Profil und Ihre "
        "Projekte sehen kann.",
        "Uploaded files": "Hochgeladene Dateien",
        "Uploaded files are stored with Amazon S3. The URLs we generate for these files are cryptographically "
        "unguessable, meaning that no one is going to be able to guess the URL for your file. However, if you share "
        "the URL for a Taskstack file, anyone with the URL will be able to see the file. Deleting a file in Taskstack "
        "removes it from Amazon S3.":
        "Hochgeladene Dateien werden mit Amazon S3 gespeichert. Die URLs die wir für diese Dateien generieren, sind "
        "kryptografisch nicht erschließbar, d.h. niemand kann die URL zu einer Ihrer Dateien erraten. Wenn Sie eine "
        "URL zu einer Taskstack Datei teilen, kann jeder mit dieser URL Ihre Datei einsehen. Das Löschen einer "
        "Taskstack Datei entfernt diese von Amazon S3."
    }
}, base_html_j2)

imprint_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Liability for contents": "Liability for contents",
        "As a service provider, we are responsible for our own content on these pages according to § 7 para.1 TMG "
        "(German Telemedia Act) and general laws. According to §§ 8 to 10 TMG we are not obliged to monitor "
        "transmitted or stored information from third parties or to investigate circumstances that indicate illegal "
        "activity. Obligations to remove or block the use of information according to general laws remain unaffected "
        "by this. However, liability in this respect is only possible from the time of knowledge of a concrete "
        "infringement. If we become aware of any such legal infringements, we will remove the content in question "
        "immediately.":
        "As a service provider, we are responsible for our own content on these pages according to § 7 para.1 TMG "
        "(German Telemedia Act) and general laws. According to §§ 8 to 10 TMG we are not obliged to monitor "
        "transmitted or stored information from third parties or to investigate circumstances that indicate illegal "
        "activity. Obligations to remove or block the use of information according to general laws remain unaffected "
        "by this. However, liability in this respect is only possible from the time of knowledge of a concrete "
        "infringement. If we become aware of any such legal infringements, we will remove the content in question "
        "immediately.",
        "Liability for links": "Liability for links",
        "Our website contains links to external websites of third parties, on whose contents we have no influence. "
        "Therefore we cannot assume any liability for these external contents. The respective provider or operator of "
        "the sites is always responsible for the contents of the linked sites. The linked pages were checked for "
        "possible legal violations at the time of linking. Illegal contents were not identified at the time of "
        "linking. However, a permanent control of the contents of the linked pages is not reasonable without concrete "
        "evidence of a violation of the law. If we become aware of any infringements, we will remove such links "
        "immediately.":
        "Our website contains links to external websites of third parties, on whose contents we have no influence. "
        "Therefore we cannot assume any liability for these external contents. The respective provider or operator of "
        "the sites is always responsible for the contents of the linked sites. The linked pages were checked for "
        "possible legal violations at the time of linking. Illegal contents were not identified at the time of "
        "linking. However, a permanent control of the contents of the linked pages is not reasonable without concrete "
        "evidence of a violation of the law. If we become aware of any infringements, we will remove such links "
        "immediately.",
        "Copyright": "Copyright",
        'Taskstack is licensed under a <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank">'
        'CC BY-NC 4.0 license</a>.':
        'Taskstack is licensed under a <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank">'
        'CC BY-NC 4.0 license</a>.',
        "Insofar as the content on this site was not created by the operator, the copyrights of third parties are "
        "respected. Should you become aware of a copyright infringement, please inform us accordingly. If we become "
        "aware of any infringements, we will remove such contents immediately.":
        "Insofar as the content on this site was not created by the operator, the copyrights of third parties are "
        "respected. Should you become aware of a copyright infringement, please inform us accordingly. If we become "
        "aware of any infringements, we will remove such contents immediately.",
        "Contact": "Contact",
        "Responsible": "Responsible",
        "Taskstack's illustrations are based on illustrations by":
            "Taskstack's illustrations are based on illustrations by",
        "and": "and",
        "on": "on",
        "Contact page": "Contact page"
    },
    "de": {
        "Liability for contents": "Haftung für Inhalte",
        "As a service provider, we are responsible for our own content on these pages according to § 7 para.1 TMG "
        "(German Telemedia Act) and general laws. According to §§ 8 to 10 TMG we are not obliged to monitor "
        "transmitted or stored information from third parties or to investigate circumstances that indicate illegal "
        "activity. Obligations to remove or block the use of information according to general laws remain unaffected "
        "by this. However, liability in this respect is only possible from the time of knowledge of a concrete "
        "infringement. If we become aware of any such legal infringements, we will remove the content in question "
        "immediately.":
        "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen "
        "Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, "
        "übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf "
        "eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von "
        "Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch "
        "erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von "
        "entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.",
        "Liability for links": "Haftung für Links",
        "Our website contains links to external websites of third parties, on whose contents we have no influence. "
        "Therefore we cannot assume any liability for these external contents. The respective provider or operator of "
        "the sites is always responsible for the contents of the linked sites. The linked pages were checked for "
        "possible legal violations at the time of linking. Illegal contents were not identified at the time of "
        "linking. However, a permanent control of the contents of the linked pages is not reasonable without concrete "
        "evidence of a violation of the law. If we become aware of any infringements, we will remove such links "
        "immediately.":
        "Unsere Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. "
        "Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten "
        "Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten "
        "wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum "
        "Zeitpunkt der Verlinkung nicht erkennbar. Permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch "
        "ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen "
        "werden wir derartige Links umgehend entfernen.",
        "Contact": "Contact",
        "Responsible": "Verantwortlicher",
        "Taskstack's illustrations are based on illustrations by":
            "Taskstacks Illustrationen basieren auf Illustrationen von",
        "and": "und",
        "on": "auf",
        "Contact page": "Kontakt Seite"
    }
}, base_html_j2)

help_html_j2 = get_extended_lexicon_dict({
    "en": {
        "How can we help you?": "How can we help you?",
        "Learn the basics of project management with Taskstack": "Learn the basics of project management with Taskstack"
    },
    "de": {
        "How can we help you?": "Wie können wir Ihnen helfen?",
        "Learn the basics of project management with Taskstack": "Lernen Sie die Grundlagen des Projektmanagements mit "
                                                                 "Taskstack"
    }
}, base_html_j2)

contact_html_j2 = get_extended_lexicon_dict({
    "en": {

    },
    "de": {

    }
}, base_html_j2)

guide_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Basics": "Basics",
        "Taskstack basics": "Taskstack basics",
        "The core element of Taskstack are projects. A taskstack project can be used e.g. for planning, information "
        "exchange or as a cloud. Here everything is about lists and cards. Lists can stand for a process: To Do, "
        "In Progress, Done or for dates... and cards for tasks. To create a Taskstack project, go to the homepage and "
        "click on New in the project list (left) or enter taskstack/new in the browser search bar.":
        "The core element of Taskstack are projects. A taskstack project can be used e.g. for planning, information "
        "exchange or as a cloud. Here everything is about lists and cards. Lists can stand for a process: To Do, "
        "In Progress, Done or for dates... and cards for tasks. To create a Taskstack project, go to the homepage and "
        "click on New in the project list (left) or enter taskstack/new in the browser search bar.",
        "Project creation": "Project creation",
        "Choose a name that fits your project (e.g. holidays, meeting-04-7-2020, ...).":
        "Choose a name that fits your project (e.g. holidays, meeting-04-7-2020, ...).",
        "Optionally you can give your project a description.": "Optionally you can give your project a description.",
        "Set who can see your project.": "Set who can see your project.",
        "To discuss and make decisions faster, you can create a linked chat group for your project.":
        "To discuss and make decisions faster, you can create a linked chat group for your project.",
        "Adding lists": "Adding lists",
        "To add a list to your project, click \"New list\" in the project menu. A list can represent a process or a "
        "step.":
        "To add a list to your project, click \"New list\" in the project menu. A list can represent a process or a "
        "step.",
        "You can give lists a detailed description and attach files.  Lists can be moved around with Drag and Drop "
        "like cards.":
        "You can give lists a detailed description and attach files.  Lists can be moved around with Drag and Drop "
        "like cards.",
        "Adding cards": "Adding cards",
        "Click \"Add card\" to add a card to a list. A card can represent a task. If you have organized your project "
        "by processes, you can drag a card to the next process list as soon as it has gone through a process. You can "
        "give cards detailed descriptions and attach files. To make it clear who is responsible for what, you can also "
        "assign members to a card.":
        "Click \"Add card\" to add a card to a list. A card can represent a task. If you have organized your project "
        "by processes, you can drag a card to the next process list as soon as it has gone through a process. You can "
        "give cards detailed descriptions and attach files. To make it clear who is responsible for what, you can also "
        "assign members to a card."
    },
    "de": {
        "Basics": "Grundlagen",
        "Taskstack basics": "Taskstack Grundlagen",
        "The core element of Taskstack are projects. A taskstack project can be used e.g. for planning, information "
        "exchange or as a cloud. Here everything is about lists and cards. Lists can stand for a process: To Do, "
        "In Progress, Done or for dates... and cards for tasks. To create a Taskstack project, go to the homepage and "
        "click on New in the project list (left) or enter taskstack/new in the browser search bar.":
        "Das Kernelement von Taskstack sind Projekte. Ein Taskstack Projekt kann z.B. zur Planung, zum "
        "Informationsaustausch oder als Cloud genutzt werden. Hierbei dreht sich alles um Listen und Karten. Listen "
        "können für einen Prozess stehen: To Do, In Progress, Done oder für ein Datum... und Karten für Aufgaben. "
        "Um ein Taskstack Projekt zu erstellen, gehen Sie auf die Homepage und klicken in der Projektliste (links) auf "
        "Neu oder geben Sie ins Browser Suchfeld taskstack/new ein.",
        "Project creation": "Projekt Erstellung",
        "Choose a name that fits your project (e.g. holidays, meeting-04-7-2020, ...).":
        "Wählen Sie einen Namen, der zu Ihrem Projekt passt (nächster-urlaub, meeting-27-07-2020, ...).",
        "Optionally you can give your project a description.": "Optional können Sie Ihrem Projekt auch eine "
                                                               "Beschreibung geben.",
        "Set who can see your project.": "Außerdem müssen Sie festlegen wer Ihr Projekt sehen kann.",
        "To discuss and make decisions faster, you can create a linked chat group for your project.":
        "Um schneller Entscheidungen zu treffen und sich auszutauschen, können Sie das Projekt auch mit einer Chat "
        "Gruppe verknüpfen.",
        "Adding lists": "Listen hinzufügen",
        "To add a list to your project, click \"New list\" in the project menu. A list can represent a process or a "
        "step.":
        "Fügen Sie dem Projekt eine Liste hinzu, indem Sie im Projekt Menü auf \"Neue Liste\" klicken. So können Sie "
        "z.B. Prozesse darstelln. Dabei kann eine Liste für einen Schritt stehen und z.B. To Do, In Progress oder "
        "Done heißen.",
        "You can give lists a detailed description and attach files.  Lists can be moved around with Drag and Drop "
        "like cards.":
        "Sie können Listen detaillierte Beschreibungen geben und Dateien anhängen. Listen können wie Karten per Drag "
        "and Drop umhergeschoben werden.",
        "Adding cards": "Karten hinzufügen",
        "Click \"Add card\" to add a card to a list. A card can represent a task. If you have organized your project "
        "by processes, you can drag a card to the next process list as soon as it has gone through a process. You can "
        "give cards detailed descriptions and attach files. To make it clear who is responsible for what, you can also "
        "assign members to a card.":
        "Fügen Sie einer Liste eine Karte hinzu, indem Sie auf \"Neue Karte\" klicken. Eine Karte kann z.B. für "
        "eine Aufgabe stehen. Wenn Sie Ihr Projekt nach Prozessen organisiert haben, können Sie eine Karte, sobald "
        "Sie einen Prozess durchlaufen hat, in die nächste Prozess Liste ziehen. Sie können Karten detaillierte "
        "Beschreibungen geben und Dateien anhängen. Um klarzumachen wer für was zuständig ist, können Sie einer Karte "
        "auch Mitglieder zuweisen."
    }
}, base_html_j2)

project_html_j2 = get_extended_lexicon_dict({
    "en": {
        "project_menu_title": "<span>P</span>roject",
        "view_menu_title": "<span>V</span>iew",
        "settings_menu_title": "<span>S</span>ettings",
        "history_menu_title": "H<span>i</span>story",
        "help_menu_title": "<span>H</span>elp",
        "Taskstack basics": "Taskstack basics",

        "Delete": "Delete",
        "Cancel": "Cancel",

        "New list": "New list",
        "Add a friend": "Add a friend",
        "Invite users with a link": "Invite users with a link",
        "Exit": "Exit",
        "Project properties": "Project properties",
        "Name & description": "Name & description",
        "Owner": "Owner",
        "Visibility for other users": "Visibility for other users",
        "Chat group": "Chat group",
        "Delete project": "Delete project",
        "Project name": "Project name",
        "Project description (optional)": "Project description (optional)",
        "Are you sure you want to delete this project permanently?": "Are you sure you want to delete this project "
                                                                     "permanently?",

        "New card": "New card",

        "List name": "List name",
        "List description (optional)": "List description (optional)",
        "Attach files by dropping them here or selecting them.": "Attach files by dropping them here or selecting "
                                                                 "them.",
        "Card name": "Card name",
        "Card description (optional)": "Card description (optional)",
        "Delete card": "Delete card",
        "Delete list": "Delete list",

        "Friend name/ email": "Friend name/ email",
        "Add with the \"Access Only\" role": "Add with the \"Access Only\" role",
        "Users with the \"Access Only\" role aren't allowed to edit your project":
        "Users with the \"Access Only\" role aren't allowed to edit your project",
        "Add as Admin": "Add as Admin",
        "Admins can create, edit and move lists and cards": "Admins can create, edit and move lists and cards",

        "Share this link to <b>add users to this project with the \"Access Only\" role</b>":
        "Share this link to <b>add users to this project with the \"Access Only\" role</b>",
        "Users added with this link can only access your project, not edit it":
        "Users added with this link can only access your project, not edit it",
        "Share this link to <b>add users as admins to this project</b>":
        "Share this link to <b>add people as admins to this project</b>",

        "This project has been deleted.": "This project has been deleted.",
        "Take me home": "Take me home",
        "The list name must be 1 - 32 characters long.": "The list name must be 1 - 32 characters long.",
        "The list description may only be 1024 characters long.": "The list description may only be 1024 characters "
                                                                 "long.",
        "The card name must be 1 - 32 characters long.": "The card name must be 1 - 32 characters long.",
        "The card description may only be 1024 characters long.": "The card description may only be 1024 characters "
                                                                 "long.",
        "The project name must be 3 - 32 characters long": "The project name must be 3 - 32 characters long",
        "The project description may only be 128 characters long": "The project description may only be 128 characters "
                                                                  "long",
        "Owner already has a project with this name": "Owner already has a project with this name",
        "Invalid project name": "Invalid project name",
        "Add card": "Add card",
        "The file must not be larger than 8 MB.": "The file must not be larger than 8 MB.",
        "A file with this name has already been selected.": "A file with this name has already been selected.",
        "Add": "Add",
        "Close": "Close",
        "Edit": "Edit",
        "Apply": "Apply",
        "Filter cards": "Filter cards",

        "Enter a name or an email address": "Enter a name or an email address",
        "Collaborators": "Collaborators",
        "Project collaborators": "Project collaborators",
        "Set who can see your project": "Set who can see your project",
        "Activate linked chat group": "Activate linked chat group",
        "Deactivate the linked chat group": "Deactivate the linked chat group",
        "Everyone": "Everyone",
        "Friends": "Friends",
        "Private": "Private",
        "Transfer this project to another collaborator": "Transfer this project to another collaborator",
        "Collaborator name/ email": "Collaborator name/ email",
        "Transfer": "Transfer",
        "Project Chat Group": "Project - Chat Group",
        "Project name & description": "Project name & description",
        "Failed to add a friend with this name/ email to this project": "Failed to add a friend with this name/ email "
                                                                        "to this project",
        "Remove from project": "Remove from project",
        "Dismiss as admin": "Dismiss as admin",
        "Make admin": "Make admin",
        "Members": "Members",
        "Select": "Select",
        "Attached files": "Attached files",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "You can use letters of the latin alphabet, numbers, dashes and underscores",

        "Leave project": "Leave project",
        "Are you sure you want to leave this project?": "Are you sure you want to leave this project?",
        "Leave": "Leave",
        "files": "files"
    },
    "de": {
        "project_menu_title": "<span>P</span>rojekt",
        "view_menu_title": "<span>A</span>nsicht",
        "settings_menu_title": "<span>E</span>instellungen",
        "history_menu_title": "<span>V</span>erlauf",
        "help_menu_title": "<span>H</span>ilfe",
        "Taskstack basics": "Taskstack Grundlagen",

        "Delete": "Löschen",
        "Cancel": "Abbrechen",

        "New list": "Neue Liste",
        "Add a friend": "Freund zu Projekt hinzufügen",
        "Invite users with a link": "Benutzer mit einem Link zu diesem Projekt einladen",
        "Exit": "Schließen",
        "Project properties": "Projekt Eigenschaften",
        "Name & description": "Name & Beschreibung",
        "Owner": "Besitzer",
        "Visibility for other users": "Sichtbarkeit für andere Nutzer",
        "Chat group": "Chat Gruppe",
        "Delete project": "Projekt löschen",
        "Project name": "Projekt Name",
        "Project description (optional)": "Projekt Beschreibung (optional)",
        "Are you sure you want to delete this project permanently?": "Sind Sie sicher, dass Sie dieses Projekt "
                                                                     "löschen möchten",

        "New card": "Neue Karte",

        "List name": "Name",
        "List description (optional)": "Beschreibung (optional)",
        "Attach files by dropping them here or selecting them.": "Hängen Sie Dateien an, indem Sie sie hier per Drag "
                                                                 "and Drop einfügen oder manuell auswählen.",
        "Card name": "Name",
        "Card description (optional)": "Beschreibung (optional)",
        "Delete card": "Karte löschen",
        "Delete list": "Liste löschen",
        
        "Friend name/ email": "Benutzername oder Email-Adresse",
        "Add with the \"Access Only\" role": "Mit der \"Access Only\" Rolle hinzufügen",
        "Users with the \"Access Only\" role aren't allowed to edit your project":
        "Benutzer mit der \"Access Only\" Rolle haben nur Zugriff auf Ihr Projekt und können es nicht bearbeiten",
        "Add as Admin": "Als Admin hinzufügen",
        "Admins can create, edit and move lists and cards": "Admins können Listen und Karten erstellen, bearbeiten und "
                                                            "verschieben",

        "Share this link to <b>add users to this project with the \"Access Only\" role</b>":
        "Teilen Sie diesen Link (z.B. per Email), um <b>Benutzer mit der \"Access Only\" Rolle zu diesem Projekt "
        "hinzuzufügen</b>",
        "Users added with this link can only access your project, not edit it":
        "Benutzer die mit diesem Link hinzugefügt werden, können nur auf Ihr Projekt zugreifen, es aber nicht "
        "bearbeiten",
        "Share this link to <b>add users as admins to this project</b>":
        "Teilen Sie diesen Link, um <b>Benutzer als Admins zu diesem Projekt hinzuzufügen</b>",

        "This project has been deleted.": "Dieses Projekt wurde gelöscht.",
        "Take me home": "nach Hause",
        "The list name must be 1 - 32 characters long.": "Der Name muss 1 - 32 Zeichen lang sein.",
        "The list description may only be 1024 characters long.": "Die Beschreibung darf maximal 1024 Zeichen lang "
                                                                 "sein.",
        "The card name must be 1 - 32 characters long.": "Der Name muss 1 - 32 Zeichen lang sein.",
        "The card description may only be 1024 characters long.": "Die Beschreibung darf maximal 1024 Zeichen lang "
                                                                 "sein.",
        "The project name must be 3 - 32 characters long": "Der Projekt Name muss 3 - 32 Zeichen lang sein.",
        "The project description may only be 128 characters long": "Die Projekt Beschreibung darf maximal 128 Zeichen "
                                                                  "lang sein",
        "Owner already has a project with this name": "Der Besitzer des Projekts besitzt bereits ein Projekt mit diesem"
                                                      " Namen",
        "Invalid project name": "Ungültiger Projektname",
        "Add card": "Neue Karte",
        "The file must not be larger than 8 MB.": "Die Datei darf nicht größer als 8 MB sein.",
        "A file with this name has already been selected.": "Es wurde bereits eine Datei mit diesem Namen ausgewählt.",
        "Add": "Hinzufügen",
        "Close": "Schließen",
        "Edit": "Bearbeiten",
        "Apply": "Bestätigen",
        "Filter cards": "Karten filtern",

        "Enter a name or an email address": "Geben Sie einen Namen oder eine Email-Adresse ein",
        "Collaborators": "Mitglieder",
        "Project collaborators": "Projekt Mitglieder",
        "Set who can see your project": "Stellen Sie ein, wer Ihr Projekt sehen kann",
        "Activate linked chat group": "Verknüpfte Chat Gruppe aktivieren",
        "Deactivate the linked chat group": "Die verknüpfte Chat Gruppe deaktivieren",
        "Everyone": "Jeder",
        "Friends": "Freunde",
        "Private": "Privat",
        "Transfer this project to another collaborator": "Dieses Projekt einem anderen Projektmitglied übertragen",
        "Collaborator name/ email": "Mitglied Name oder Email-Adresse",
        "Transfer": "Übertragen",
        "Failed to transfer the project to a collaborator with this name/ email": "Übertragen fehlgeschlagen",
        "Project Chat Group": "Projekt - Chat Gruppe",
        "Project name & description": "Projekt Name & Beschreibung",
        "Failed to add a friend with this name/ email to this project": "Hinzufügen eines Freundes mit diesem Namen/ "
                                                                        "dieser Email-Adresse fehlgeschlagen",
        "Remove from project": "Entfernen",
        "Dismiss as admin": "Admin Status entziehen",
        "Make admin": "Zum Projektadmin machen",
        "Members": "Mitglieder",
        "Select": "Auswählen",
        "Attached files": "Angehängte Dateien",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "Sie können Buchstaben des lateinischen Alphabets, Zahlen, Bindestriche und Unterstriche verwenden",

        "Leave project": "Projekt verlassen",
        "Are you sure you want to leave this project?": "Sind Sie sicher, dass Sie dieses Projekt verlassen "
                                                        "möchten?",
        "Leave": "Verlassen",
        "files": "Dateien"
    }
}, base_html_j2)

home_unauth_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Get more done with Taskstack": "Get more done with Taskstack",
        "Whether you work with a large team or just plan something on your own, Taskstack's effective Kanban project "
        "management is right for you.": "Whether you work with a large team or just plan something on your own, "
                                        "Taskstack's effective "
                                        "<a href=\"https://en.wikipedia.org/wiki/Kanban_board\" target=\"_blank\">"
                                        "Kanban project management</a> is right for you.",
        "Taskstack's features on any device": "Taskstack's features on any device",
        "Intuitive kanban project management - easy list and card creation... </br> Attach files, assign users... "
        "</br> Move \"things\" arround with drag and drop.":
        "Intuitive kanban project management - easy list and card creation... </br> Attach files, assign users... "
        "</br> Move \"things\" arround with drag and drop.",
        "Discuss and make decisions faster with user to user chat, custom chat groups and project linked chat groups.":
        "Discuss and make decisions faster with user to user chat, custom chat groups and project linked chat groups.",
        "All this in real time! Work on a project with an unlimited number of people at the same time... "
        "Changes are automatically synchronized in a fraction of a second.":
        "All this in real time! Work on a project with an unlimited number of people at the same time... "
        "Changes are automatically synchronized in a fraction of a second.",
        "Taskstack is currently still in Beta": "Taskstack is currently still in Beta",
        "Does that mean, many bugs and unclean UI are to be expected?": "Does that mean, many bugs and unclean UI are "
                                                                        "to be expected?",
        "No. That just means that Taskstack is still in very active development and many features will be added over "
        "time.":
        "No. That just means that Taskstack is still in very active development and many features will be added over "
        "time.",
        "Taskstack is 100% free!": "Taskstack is 100% free!",
        "No ads, no data sold to third party companies.": "No ads, no data sold to third party companies.",
        "How can Taskstack be free?": "How can Taskstack be free?",
        "Taskstack is developed as a hobby project. You can even view the source code.":
        "Taskstack is developed as a hobby project. You can even view the "
        "<a href=\"https://github.com/juliuskrahn/taskstack\" target=\"_blank\">source code</a>.",
        "Start doing awesome stuff now": "Start doing awesome stuff now"
    },
    "de": {
        "Get more done with Taskstack": "Besser planen mit Taskstack",
        "Whether you work with a large team or just plan something on your own, Taskstack's effective Kanban project "
        "management is right for you.": "Ob Sie mit einem großen Team arbeiten oder den nächsten Urlaub planen, "
                                        "Taskstacks effektives "
                                        "<a href=\"https://en.wikipedia.org/wiki/Kanban_board\" target=\"_blank\">"
                                        "Kanban Projekt Management</a> hilft Ihnen dabei.",
        "Taskstack's features on any device": "Taskstacks Features auf jedem Gerät",
        "Intuitive kanban project management - easy list and card creation... </br> Attach files, assign users... "
        "</br> Move \"things\" arround with drag and drop.":
        "Intuitives Kanban Projekt Management - einfache Erstellung von Listen und Karten... </br> "
        "Dateien anhängen, Mitgliedern Aufgaben zuweisen... "
        "</br> Listen und Karten einfach per Drag and Drop umherschieben.",
        "Discuss and make decisions faster with user to user chat, custom chat groups and project linked chat groups.":
        "Wichtige Themen besprechen und schneller Entscheidungen treffen mit privaten Chats, Chat Gruppen und "
        "Projekt Chat Gruppen.",
        "All this in real time! Work on a project with an unlimited number of people at the same time... "
        "Changes are automatically synchronized in a fraction of a second.":
        "All das in Echtzeit! Arbeiten Sie mit einer unbegrenzten Anzahl von Leuten gleichzeitig an einem Projekt... "
        "Änderungen werden in Sekundenbruchteilen automatisch synchronisiert.",
        "Taskstack is currently still in Beta": "Taskstack ist momentan noch in der Beta-Phase",
        "Does that mean, many bugs and unclean UI are to be expected?": "Bedeutet das viele Bugs?",
        "No. That just means that Taskstack is still in very active development and many features will be added over "
        "time.": "Nein. Das bedeutet nur, dass Taskstack noch in einer sehr aktiven Entwicklungsphase ist und dass mit "
                 "der Zeit viele weitere Features dazukommen.",
        "Taskstack is 100% free!": "Taskstack ist 100% gratis!",
        "No ads, no data sold to third party companies.": "Keine Werbung, kein Verkauf von Daten an Dritte.",
        "How can Taskstack be free?": "Wie kann Taskstack kostenlos sein?",
        "Taskstack is developed as a hobby project. You can even view the source code.":
            "Taskstack wird als Hobby Projekt entwickelt. Sie können sogar den "
            "<a href=\"https://github.com/juliuskrahn/taskstack\" target=\"_blank\">Source Code</a> einsehen.",
        "Start doing awesome stuff now": "Jetzt mit Tasktack loslegen"
    }
}, base_html_j2)

home_auth_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Projects": "Projects",
        "Friends": "Friends",
        "New": "New",
        "Add": "Add",
        "Nothing new here": "Nothing new here",
        "Mark as read": "Mark as read",
        "Friendship request": "Friendship request",
        "How about a short introduction to Taskstack?": "How about a short introduction to Taskstack?",
        "Learn the basics of using Taskstack to make all your organizational dreams come true.":
        "Learn the basics of using Taskstack to make all your organizational dreams come true.",
        "Taskstack basics": "Taskstack basics",
        "This is your newsfeed. Unread messages or friendship requests... will be displayed here.":
        "This is your newsfeed. Unread messages or friendship requests... will be displayed here."
    },
    "de": {
        "Projects": "Projekte",
        "Friends": "Freunde",
        "New": "Neu",
        "Add": "Hinzufügen",
        "Nothing new here": "Nichts neues",
        "Mark as read": "Als gelesen markieren",
        "Friendship request": "Freundschaftsanfrage",
        "How about a short introduction to Taskstack?": "Wie wäre es mit einer kurzen Einführung in Taskstack?",
        "Learn the basics of using Taskstack to make all your organizational dreams come true.":
        "Lernen Sie die Grundlagen von Taskstack, um gleich loszulegen.",
        "Taskstack basics": "Taskstack Grundlagen",
        "This is your newsfeed. Unread messages or friendship requests... will be displayed here.":
        "Das ist Ihr Newsfeed. Ungelesene Nachrichten oder Freundschaftsanfragen... werden hier angezeigt."
    }
}, base_html_j2)

chat_html_j2 = get_extended_lexicon_dict({
    "en": {
        "New friend": "New friend",
        "New group": "New group",
        "Apply": "Apply",
        "Close": "Close",
        "Group name": "Group name",
        "Create group": "Create group",
        "Cancel": "Cancel",
        "Edit": "Edit",
        "Add friend": "Add friend",
        "Leave group": "Leave group",
        "Delete group": "Delete group",
        "Friend name/ email": "Friend name/ email",
        "Add": "Add",
        "Enter a name or an email address": "Enter a name or an email address",
        "Enter a group name (1 - 32 characters long)": "Enter a group name (1 - 32 characters long)",
        "Remove from group": "Remove from group",
        "Dismiss as admin": "Dismiss as admin",
        "Make admin": "Make admin",
        "Failed to add a user with this name/ email to this group": "Failed to add a user with this name/ email to "
                                                                    "this group",
        "Add a friend to: ": "Add a friend to: "
    },
    "de": {
        "New friend": "Freund hinzufügen",
        "New group": "Neue Gruppe",
        "Apply": "Bestätigen",
        "Close": "Schließen",
        "Group name": "Gruppen Name",
        "Create group": "Gruppe erstellen",
        "Cancel": "Abbrechen",
        "Edit": "Bearbeiten",
        "Add friend": "Freund hinzufügen",
        "Leave group": "Gruppe verlassen",
        "Delete group": "Gruppe löschen",
        "Friend name/ email": "Benutzername oder Email-Adresse",
        "Add": "Hinzufügen",
        "Enter a name or an email address": "Geben Sie einen Namen oder eine Email-Adresse ein",
        "Enter a group name (1 - 32 characters long)": "Geben Sie einen Gruppen Namen ein (1 - 32 Zeichen lang)",
        "Remove from group": "Aus Gruppe entfernen",
        "Dismiss as admin": "Admin Status entziehen",
        "Make admin": "Zum Gruppenadmin machen",
        "Failed to add a user with this name/ email to this group": "Hinzufügen eines Benutzers mit diesem Namen/ "
                                                                    "dieser Email-Adresse fehlgeschlagen",
        "Add a friend to: ": "Einen Freund hinzufügen zu: "
    }
}, base_html_j2)

login_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Login": "Login",
        "Username or email": "Username or email",
        "Password": "Password",
        "keep me logged in": "keep me logged in",
        "Create an account instead": "Create an account instead",
        "Enter your username or email address": "Enter your username or email address",
        "Enter your password": "Enter your password",
        "Wrong username/ email or password": "Wrong username/ email or password",
        "Forgot your password?": "Forgot your password?"
    },
    "de": {
        "Login": "Anmelden",
        "Username or email": "Benutzername oder Email",
        "Password": "Passwort",
        "keep me logged in": "Eingeloggt bleiben",
        "Create an account instead": "Account erstellen",
        "Enter your username or email address": "Geben Sie Ihren Benutzernamen oder Ihre Email-Adresse ein",
        "Enter your password": "Geben Sie Ihr Passwort ein",
        "Wrong username/ email or password": "Falscher Benutzername/ Email-Adresse oder falsches Passwort",
        "Forgot your password?": "Passwort vergessen?"
    }
}, base_light_html_j2)

signup_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Create your Taskstack Account": "Create your Taskstack Account",
        "Username": "Username",
        "Email address": "Email address",
        "Password": "Password",
        "Confirm": "Confirm",
        "password_guide": "Use 8 or more characters with a mix of letters,<br/> numbers and symbols",
        "keep me logged in": "keep me logged in",
        "Log in instead": "Log in instead",
        "Next": "Next",
        "This username is not available": "This username is not available",
        "Invalid username": "Invalid username",
        "Invalid email address": "Invalid email address",
        "Enter username (at least 3 characters long)": "Enter username (at least 3 characters long)",
        "The username may only be 16 characters long": "The username may only be 16 characters long",
        "Enter email address": "Enter email address",
        "The email address may only be 32 characters long": "The email address may only be 32 characters long",
        "Passwords do not match": "Passwords do not match",
        "Enter a password with at least 8 characters": "Enter a password with at least 8 characters",
        "The password may only be 64 characters long": "The password may only be 64 characters long",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "You can use letters of the latin alphabet, numbers, dashes and underscores (the first character has to be "
            "a letter)"
    },
    "de": {
        "Sign up": "Registrieren",
        "Create your Taskstack Account": "Einen Taskstack Account erstellen",
        "Username": "Benutzername",
        "Email address": "Email-Adresse",
        "Password": "Passwort",
        "Confirm": "Bestätigen",
        "password_guide": "Verwenden Sie mindestens 8 Zeichen<br/>mit einem Mix aus Buchstaben, Zahlen und Symbolen",
        "keep me logged in": "Eingeloggt bleiben",
        "Log in instead": "Sie haben bereits einen Account?",
        "Next": "Weiter",
        "This username is not available": "Dieser Benutzername ist nicht verfügbar",
        "Invalid username": "Ungültiger Benutzername",
        "Invalid email address": "Ungültige Email-Adresse",
        "Enter username (at least 3 characters long)": "Geben Sie einen Benutzernamen ein (mind. 3 Zeichen lang)",
        "The username may only be 16 characters long": "Der Benutzername darf maximal 16 Zeichen lang sein",
        "Enter email address": "Geben Sie Ihre Email-Adresse ein",
        "The email address may only be 32 characters long": "Die Email-Adresse darf maximal 32 Zeichen lang sein",
        "Passwords do not match": "Die Passwörter stimmen nicht überein",
        "Enter a password with at least 8 characters": "Das Passwort muss mindestens 8 Zeichen lang sein",
        "The password may only be 64 characters long": "Dass Passwort darf maximal 64 Zeichen lang sein",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "Sie können Buchstaben des lateinischen Alphabets, Zahlen, Bindestriche und Unterstriche verwenden "
            "(das erste Zeichen muss ein Buchstabe sein)"
    }
}, base_light_html_j2)

signup_view_func = {
    "en": {
        "This username is not available": "This username is not available",
        "This email address is not available": "This email address is not available",
        "Invalid username": "Invalid username",
        "Invalid email address": "Invalid email address",
        "Invalid password": "Invalid password",
        "[Taskstack] Verify your email address": "[Taskstack] Verify your email address"
    },
    "de": {
        "This username is not available": "Dieser Benutzername ist nicht verfügbar",
        "This email address is not available": "Diese Email-Adresse ist nicht verfügbar",
        "Invalid username": "Ungültiger Benutzername",
        "Invalid email address": "Ungültige Email-Adresse",
        "Invalid password": "Ungültiges Passwort",
        "[Taskstack] Verify your email address": "[Taskstack] Verifizieren Sie Ihre Email-Adresse"
    }
}

verify_email_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Verify email address": "Verify email address",
        "Verify your email address": "Verify your email address",
        "Almost done": "Almost done",
        "To complete your Taskstack sign up, we just need to verify your email address": "To complete your Taskstack "
                                                                                         "sign up, we just need to "
                                                                                         "verify your email address",
        "Please enter the code you have received from us below.": "Please enter the code you have received from us "
                                                                  "below.",
        "Verify your new email address": "Verify your new email address",
        "We have sent you an email to": "We have sent you an email to",
        "Your email verification code": "Your email verification code",
        "Wrong code": "Wrong code",
        "Verify": "Verify",
        "The code is 8 characters long": "The code is 8 characters long"
    },
    "de": {
        "Verify email address": "Email-Adresse verifzieren",
        "Verify your email address": "Verifizieren Sie Ihre Email-Adresse",
        "Almost done": "Fast fertig",
        "To complete your Taskstack sign up, we just need to verify your email address": "Um Ihre Anmeldung "
                                                                                         "abzuschließen, müssen wir "
                                                                                         "nur noch Ihre Email-Adresse"
                                                                                         " verifizieren",
        "Please enter the code you have received from us below.": "Bitte geben Sie unten den Code ein, den Sie von uns "
                                                                  "erhalten haben.",
        "Verify your new email address": "Verifizieren Sie Ihre neue Email-Adresse",
        "We have sent you an email to": "Wir haben Ihnen eine Email an",
        "ger_sent": "gesendet",
        "Your email verification code": "Ihr Code",
        "Wrong code": "Falscher Code",
        "Verify": "Verifizieren",
        "The code is 8 characters long": "Der Code ist 8 Zeichen lang"
    }
}, base_light_html_j2)

forgot_password_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Forgot password": "Forgot password",
        "Next": "Next",
        "Cancel": "Cancel",
        "Username or email": "Username or email",
        "There is no account with this username/ email": "There is no account with this username/ email",
        "Enter your username or email address": "Enter your username or email address"
    },
    "de": {
        "Forgot password": "Passwort vergessen",
        "Next": "Weiter",
        "Cancel": "Abbrechen",
        "Username or email": "Benutzername oder Email-Adresse",
        "There is no account with this username/ email": "Es gibt keinen Account mit diesem Benutzernamen/ dieser "
                                                         "Email-Adresse",
        "Enter your username or email address": "Geben Sie Ihren Benutzernamen oder Ihre Email-Adresse ein"
    }
}, base_light_html_j2)

forgot_password_view_func = {
    "en": {
        "[Taskstack] Reset password": "[Taskstack] Reset password"
    },
    "de": {
        "[Taskstack] Reset password": "[Taskstack] Passwort zurücksetzen"
    }
}

reset_password_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Reset password": "Reset password",
        "We have sent you an email. Please enter the code you have received from us below and set your new password.":
            "We have sent you an email. Please enter the code you have received from us below and set your new "
            "password.",
        "Your code": "Your code",
        "Wrong code": "Wrong code",
        "password_guide": "Use 8 or more characters with a mix of letters,<br/> numbers and symbols",
        "New password": "New password",
        "Confirm": "Confirm",
        "Passwords do not match": "Passwords do not match",
        "Enter a password with at least 8 characters": "Enter a password with at least 8 characters",
        "The password may only be 64 characters long": "The password may only be 64 characters long",
        "The code is 8 characters long": "The code is 8 characters long"
    },
    "de": {
        "Reset password": "Passwort zurücksetzen",
        "We have sent you an email. Please enter the code you have received from us below and set your new password.":
            "Bitte geben Sie unten den Code ein, den Sie von uns via Email erhalten haben - und wählen ein neues "
            "Passwort.",
        "Your code": "Ihr Code",
        "Wrong code": "Falscher Code",
        "password_guide": "Verwenden Sie mindestens 8 Zeichen<br/>mit einem Mix aus Buchstaben, Zahlen und Symbolen",
        "New password": "Neues Passwort",
        "Confirm": "Bestätigen",
        "Passwords do not match": "Passwörter stimmen nicht überein",
        "Enter a password with at least 8 characters": "Das Passwort muss mindestens 8 Zeichen lang sein",
        "The password may only be 64 characters long": "Das Passwort darf maximal 64 Zeichen lang sein",
        "The code is 8 characters long": "Der Code ist 8 Zeichen lang"
    }
}, base_light_html_j2)

user_profile_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Edit Profile": "Edit Profile",
        "Enter a profile description": "Enter a profile description",
        "Cancel": "Cancel",
        "Save": "Save",
        "Invalid token. Reload the page and try again.": "Invalid token. Reload the page and try again.",
        "The profile description may only be 256 characters long": "The profile description may only be 256 characters "
                                                                   "long",
        "Projects": "Projects",
        "Friends": "Friends",
        "Settings": "Settings",

        "Remove friend": "Remove friend",
        "Send friendship request": "Send friendship request",
        "Go to chat": "Go to chat",
        "Are you sure that you want to remove this friend?": "Are you sure that you want to remove this friend?",
        "Remove": "Remove"
    },
    "de": {
        "Edit Profile": "Profil bearbeiten",
        "Enter a profile description": "Profil Beschreibung",
        "Cancel": "Abbrechen",
        "Save": "Speichern",
        "Invalid token. Reload the page and try again.": "Ungültiges Token. Laden Sie die Seite neu und versuchen Sie "
                                                         "es erneut.",
        "The profile description may only be 256 characters long": "Die Profil Beschreibung darf maximal 256 Zeichen "
                                                                   "lang sein",
        "Projects": "Projekte",
        "Friends": "Freunde",
        "Settings": "Einstellungen",

        "Remove friend": "Freund entfernen",
        "Send friendship request": "Freundschaftsanfrage senden",
        "Go to chat": "zum Chat",
        "Are you sure that you want to remove this friend?": "Sind Sie sicher, dass Sie diesen Freund entfernen "
                                                             "möchten?",
        "Remove": "Entfernen"
    }
}, base_html_j2)

user_profile_projects_html_j2 = get_extended_lexicon_dict({
    "en": {

    }, "de": {

    }
}, user_profile_html_j2)

user_profile_friends_html_j2 = get_extended_lexicon_dict({
    "en": {

    }, "de": {

    }
}, user_profile_html_j2)

user_profile_settings_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Interaction with other users": "Interaction with other users",
        "Hide my email address": "Hide my email address",
        "Set my account to private": "Set my account to private",
        "Keep me logged in": "Keep me logged in",
        "Automatically block all friendship requests": "Automatically block all friendship requests",
        "Change my username": "Change my username",
        "Change my email address": "Change my email address",
        "Change my password": "Change my password",
        "Delete my account": "Delete my account",
        "New username": "New username",
        "Password": "Password",
        "Apply": "Apply",
        "New email address": "New email address",
        "Old password": "Old password",
        "New password": "New password",
        "Are you sure that you want to delete your account permanently?": "Are you sure that you want to delete your "
                                                                          "account permanently?",
        "Enter your new username": "Enter your new username",
        "The username has to be at least 3 characters long": "The username has to be at least 3 characters long",
        "The username may only be 16 characters long": "The username may only be 16 characters long",
        "Invalid username": "Invalid username",
        "Enter your password": "Enter your password",
        "Enter your new email address": "Enter your new email address",
        "The email address may only be 32 characters long": "The email address may only be 32 characters long",
        "Invalid email address": "Invalid email address",
        "Enter your old password": "Enter your old password",
        "Passwords do not match": "Passwords do not match",
        "Enter a password with at least 8 characters": "Enter a password with at least 8 characters",
        "The password may only be 64 characters long": "The password may only be 64 characters long",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "You can use letters of the latin alphabet, numbers, dashes and underscores (the first character has to be "
            "a letter)"
    },
    "de": {
        "Interaction with other users": "Interaktion mit anderen Nutzern",
        "Hide my email address": "Email Adresse vor anderen Nutzern verbergen",
        "Set my account to private": "Account privat stellen",
        "Keep me logged in": "Eingeloggt bleiben",
        "Automatically block all friendship requests": "Alle eingehenden Freundschaftsanfragen automatisch blockieren",
        "Change my username": "Benutzernamen ändern",
        "Change my email address": "Email-Adresse ändern",
        "Change my password": "Passwort ändern",
        "Delete my account": "Account löschen",
        "New username": "Neuer Benutzername",
        "Password": "Passwort",
        "Apply": "Bestätigen",
        "New email address": "Neue Email-Adresse",
        "Old password": "Altes Passwort",
        "New password": "Neues Passwort",
        "Are you sure that you want to delete your account permanently?": "Sind Sie sicher, dass Sie Ihren Account "
                                                                          "löschen möchten?",
        "Enter your new username": "Geben Sie Ihren neuen Benutzernamen ein",
        "The username has to be at least 3 characters long": "Der Benutzername muss mindestens 3 Zeichen lang sein",
        "The username may only be 16 characters long": "Der Benutzername darf maximal 16 Zeichen lang sein",
        "Invalid username": "Ungültiger Benutzername",
        "Enter your password": "Geben Sie Ihr Passwort ein",
        "Enter your new email address": "Geben Sie Ihre neue Email-Adresse ein",
        "The email address may only be 32 characters long": "Die Email-Adresse darf maximal 32 Zeichen lang sein",
        "Invalid email address": "Ungültige Email-Adresse",
        "Enter your old password": "Geben Sie Ihr altes Passwort ein",
        "Passwords do not match": "Die Passwörter stimmen nicht überein",
        "Enter a password with at least 8 characters": "Das Passwort muss mindestens 8 Zeichen lang sein",
        "The password may only be 64 characters long": "Das Passwort darf maximal 64 Zeichen lang sein",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "Sie können Buchstaben des lateinischen Alphabets, Zahlen, Bindestriche und Unterstriche verwenden "
            "(das erste Zeichen muss ein Buchstabe sein)"
    }
}, user_profile_html_j2)

user_profile_settings_view_func = {
    "en": {
        "This username is not available": "This username is not available",
        "Invalid username": "Invalid username",
        "Wrong password": "Wrong password",
        "This email address is not available": "This email address is not available",
        "Invalid email address": "Invalid email address",
        "Invalid password": "Invalid password",
        "[Taskstack] Verify your new email address": "[Taskstack] Verify your new email address"
    },
    "de": {
        "This username is not available": "Dieser Benutzername ist nicht verfügbar",
        "Invalid username": "Ungültiger Benutzername",
        "Wrong password": "Falsches Passwort",
        "This email address is not available": "Diese Email-Adresse ist nicht verfügbar",
        "Invalid email address": "Ungültige Email-Adresse",
        "Invalid password": "Ungültiges Passwort",
        "[Taskstack] Verify your new email address": "[Taskstack] Verifizieren Sie Ihre neue Email-Adresse"
    }
}

new_project_html_j2 = get_extended_lexicon_dict({
    "en": {
        "New Project": "New Project",
        "Create a new project": "Create a new project",
        "and realize your ideas": "and realize your ideas",
        "Owner": "Owner",
        "Project name": "Project name",
        "Project description (optional)": "Project description (optional)",
        "Create project": "Create project",
        "Owner already has a project with that name": "Owner already has a project with that name",
        "Invalid project name": "Invalid project name",
        "The project name may only be 32 characters long": "The project name may only be 32 characters long",
        "Enter project name (at least 3 characters long)": "Enter project name (at least 3 characters long)",
        "Cancel": "Cancel",
        "Private project": "Private project",
        "If your project is private, only the you and added contributors can view the project "
        "(you can change this later on).": "If your project is private, only the you and added contributors can view "
                                           "the project </br>(you can change this later on).",
        "Create a linked chat group": "Create a linked chat group",
        "You and every collaborator will be member of this group. Actions like changing the project name will also be "
        "applied to this chat group.": "You and every collaborator will be member of this group. Actions like changing "
                                       "the project name will also be applied to this chat group.",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "You can use letters of the latin alphabet, numbers, dashes and underscores"
    },
    "de": {
        "New Project": "Neues Projekt",
        "Create a new project": "Ein neues Projekt erstellen",
        "and realize your ideas": "",
        "Owner": "Besitzer",
        "Project name": "Projekt Name",
        "Project description (optional)": "Projekt Beschreibung (optional)",
        "Create project": "Projekt erstellen",
        "Owner already has a project with that name": "Der Besitzer des neuen Projekts besitzt bereits ein Projekt mit "
                                                      "diesem Namen",
        "Invalid project name": "Ungültiger Projekt Name",
        "The project name may only be 32 characters long": "Der Projekt Name darf maximal 32 Zeichen lang sein",
        "Enter project name (at least 3 characters long)": "Geben Sie einen Namen für Ihr Projekt ein (mindestens 3 "
                                                           "Zeichen lang)",
        "The project description may only be 128 characters long": "Die Projekt Beschreibung darf maximal 128 Zeichen "
                                                                   "lang sein",
        "Cancel": "Abbrechen",
        "Private project": "Privates Projekt",
        "If your project is private, only the you and added contributors can view the project "
        "(you can change this later on).": "Wenn ein Projekt privat ist, können nur Sie und hinzugefügte "
                                           "Benutzer das Projekt sehen </br>(kann jederzeit geändert werden).",
        "Create a linked chat group": "Verknüpfte Chat Gruppe erstellen",
        "You and every collaborator will be member of this group. Actions like changing the project name will also be "
        "applied to this chat group.": "Sie und dem Projekt hinzugefügte Benutzer werden Mitglieder dieser Gruppe. "
                                       "Aktionen wie z.B. das Ändern des Projektnames werden auch auf diese Gruppe "
                                       "angwendet.",
        "You can use letters of the latin alphabet, numbers, dashes and underscores":
            "Sie können Buchstaben des lateinischen Alphabets, Zahlen, Bindestriche und Unterstriche verwenden"
    }
}, base_html_j2)

new_friend_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Add friend": "Add a friend",
        "Username or email": "Username or email",
        "There is no user with this name or email": "There is no user with this name or email",
        "Cancel": "Cancel",
        "Send friendship request": "Send friendship request",
        "Enter username/ email": "Enter username/ email",
        "Invalid target": "Invalid target"
    },
    "de": {
        "Add friend": "Freund hinzufügen",
        "Username or email": "Benutzername oder Email-Adresse",
        "There is no user with this name or email": "Es gibt keinen Benutzer mit diesem Namen/ dieser Email-Adresse",
        "Cancel": "Abbrechen",
        "Send friendship request": "Freundschaftsanfrage senden",
        "Enter username/ email": "Geben Sie einen einen Benutzernamen/ Email-Adresse ein",
        "Invalid target": "Ungültiger Benutzer für Freundschaftsanfrage"
    }
}, base_html_j2)

invite_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Join project: ": "Join project: ",
        "Cancel": "Cancel",
        "Join": "Join",
        "success_msg_part_1": "You successfully joined the project",
        "success_msg_part_2": "with the role",
        "success_msg_part_3": ""
    },
    "de": {
        "Join project: ": "Projekt beitreten: ",
        "Cancel": "Abbrechen",
        "Join": "Beitreten",
        "success_msg_part_1": "Sie sind dem Projekt",
        "success_msg_part_2": "mit der Rolle",
        "success_msg_part_3": " beigetreten"
    }
}, base_html_j2)

error_400_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Bad Request. Your browser sent a request that this server could not understand.":
            "Bad Request. Your browser sent a request that this server could not understand."
    },
    "de": {
        "Bad Request. Your browser sent a request that this server could not understand.":
            "Ihr Browser hat eine Anfrage gesendet, die dieser Server nicht verstehen konnte."
    }
}, base_html_j2)

error_404_html_j2 = get_extended_lexicon_dict({
    "en": {
        "The content you are looking for does not exist/ has been moved/ requires authentication.":
            "The content you are looking for does not exist/ has been moved/ requires authentication.",
        "Take me home": "Take me home"
    },
    "de": {
        "The content you are looking for does not exist/ has been moved/ requires authentication.":
            "Der gesuchte Inhalt exisitert nicht/ wurde verschoben/ erfordert Authentifizierung.",
        "Take me home": "nach Hause"
    }
}, base_html_j2)

error_500_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Internal Server Error":
            "Internal Server Error"
    },
    "de": {
        "Internal Server Error":
            "Interner Server Error"
    }
}, base_html_j2)


# email templates

email_base_html_and_txt_j2 = {
    "en": {}, "de": {}
}

email_account_created_verify_email_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Almost done": "Almost done",
        "To complete your Taskstack sign up, we just need to verify your email address": "To complete your Taskstack "
                                                                                         "sign up, we just need to "
                                                                                         "verify your email address",
        "Once verified, you can start using all of Taskstack's features to explore, build, and share projects.":
            "Once verified, you can start using all of Taskstack's features to explore, build, and share projects.",
        "Your email verification code": "Your email verification code",
        "Verify email address": "Verify email address",
        "Button not working? Paste the following URL into your browser": "Button not working? Paste the following URL "
                                                                         "into your browser",
        "You’re receiving this email because you recently created a new Taskstack account. If this wasn’t you, please "
        "ignore this email.": "You’re receiving this email because you recently created a new Taskstack account. If "
                              "this wasn’t you, please ignore this email."
    },
    "de": {
        "Almost done": "Fast fertig",
        "To complete your Taskstack sign up, we just need to verify your email address": "Um Ihre Registrierung "
                                                                                         "abzuschließen, müssen wir "
                                                                                         "nur noch Ihre Email-Adresse"
                                                                                         " verifizieren",
        "Once verified, you can start using all of Taskstack's features to explore, build, and share projects.":
            "Sobald Ihre Email-Adresse verifiziert wurde, können Sie gleich loslegen und Ihr erstes Projekt starten...",
        "Your email verification code": "Ihr Code",
        "Verify email address": "Email-Adresse verifizieren",
        "Button not working? Paste the following URL into your browser": "Der Button funktioniert nicht? Fügen Sie die "
                                                                         "folgende URL in Ihr Browser Suchfeld ein",
        "You’re receiving this email because you recently created a new Taskstack account. If this wasn’t you, please "
        "ignore this email.": "Sie erhalten diese Email weil Sie kürzlich einen Taskstack Account erstellt haben. "
                              "Falls nicht: ignorieren Sie bitte diese Email."
    }
}, email_base_html_and_txt_j2)
email_account_created_verify_email_txt_j2 = email_account_created_verify_email_html_j2

email_verify_new_email_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Your email verification code": "Your email verification code",
        "Verify email address": "Verify email address",
        "Button not working? Paste the following URL into your browser": "Button not working? Paste the following URL "
                                                                         "into your browser"
    },
    "de": {
        "Your email verification code": "Ihr Code",
        "Verify email address": "Email-Adresse verifizieren",
        "Button not working? Paste the following URL into your browser": "Der Button funktioniert nicht? Fügen Sie die "
                                                                         "folgende URL in Ihr Browser Suchfeld ein"
    }
}, email_base_html_and_txt_j2)
email_verify_new_email_txt_j2 = email_verify_new_email_html_j2

email_reset_password_html_j2 = get_extended_lexicon_dict({
    "en": {
        "Your code": "Your code",
        "Reset password": "Reset password",
        "Button not working? Paste the following URL into your browser": "Button not working? Paste the following URL "
                                                                         "into your browser",
        "You’re receiving this email because you recently requested a password reset. If this wasn't you, please "
        "ignore this email.": "You’re receiving this email because you recently requested a password reset. If this "
                              "wasn't you, please ignore this email."
    },
    "de": {
        "Your code": "Ihr Code",
        "Reset password": "Passwort zurücksetzen",
        "Button not working? Paste the following URL into your browser": "Der Button funktioniert nicht? Fügen Sie die "
                                                                         "folgende URL in Ihr Browser Suchfeld ein",
        "You’re receiving this email because you recently requested a password reset. If this wasn't you, please "
        "ignore this email.": "Sie erhalten diese Email, weil Sie kürzlich eine Passwort-Zurücksetzungs-Anfrage "
                              "gestellt haben. Falls nicht: ignorieren Sie bitte diese Email."
    }
}, email_base_html_and_txt_j2)
email_reset_password_txt_j2 = email_reset_password_html_j2
