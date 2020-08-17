import unittest
from utils.get_insert_replace.main import MATCH, NO_MATCH, POT_MATCH
from utils.get_insert_replace.main import Marker, OptionalMarker, RepeatableMarker, OptionalRepeatableMarker, \
    MultiplePossibleMarkers,  NewlineOrEnd
from utils.get_insert_replace.main import MarkerSequence
from utils.get_insert_replace.main import REPLACE_TARGET, REPLACE_TARGET_AND_MARKER_SEQUENCE, \
    REPLACE_TARGET_AND_MARKER_SEQUENCE_BEFORE, REPLACE_TARGET_AND_MARKER_SEQUENCE_AFTER
from utils.get_insert_replace.main import Replacer, Getter


class TestMarker(unittest.TestCase):
    def test_match(self):
        marker1 = Marker(" ")
        marker2 = Marker("test")

        string1 = ""
        string2 = " "
        string3 = "test"
        string4 = "tes"
        string5 = "testt"
        string6 = "bla"
        string7 = "_"

        self.assertEqual(marker1.match(string1), POT_MATCH)
        self.assertEqual(marker1.match(string2), MATCH)
        self.assertEqual(marker1.match(string3), NO_MATCH)
        self.assertEqual(marker1.match(string7), NO_MATCH)
        self.assertEqual(marker1.match(string6), NO_MATCH)
        self.assertEqual(marker2.match(string1), POT_MATCH)
        self.assertEqual(marker2.match(string2), NO_MATCH)
        self.assertEqual(marker2.match(string3), MATCH)
        self.assertEqual(marker2.match(string4), POT_MATCH)
        self.assertEqual(marker2.match(string5), NO_MATCH)
        self.assertEqual(marker2.match(string6), NO_MATCH)

        with self.assertRaises(ValueError):
            Marker("")


class TestOptionalMarker(unittest.TestCase):
    def test_match(self):
        marker1 = OptionalMarker(" ")
        marker2 = OptionalMarker("test")

        string1 = ""
        string2 = " "
        string3 = "test"
        string4 = "tes"
        string5 = "testt"
        string6 = "bla"
        string7 = "_"

        self.assertEqual(marker1.match(string1), POT_MATCH)
        self.assertEqual(marker1.match(string2), MATCH)
        self.assertEqual(marker1.match(string3), NO_MATCH)
        self.assertEqual(marker1.match(string7), NO_MATCH)
        self.assertEqual(marker1.match(string6), NO_MATCH)
        self.assertEqual(marker2.match(string1), POT_MATCH)
        self.assertEqual(marker2.match(string2), NO_MATCH)
        self.assertEqual(marker2.match(string3), MATCH)
        self.assertEqual(marker2.match(string4), POT_MATCH)
        self.assertEqual(marker2.match(string5), NO_MATCH)
        self.assertEqual(marker2.match(string6), NO_MATCH)

        with self.assertRaises(ValueError):
            OptionalMarker("")


class TestRepeatableMarker(unittest.TestCase):
    def test_match(self):
        marker1 = RepeatableMarker(" ")
        marker2 = RepeatableMarker("test")

        string1 = ""
        string2 = " "
        string3 = "test"
        string4 = "tes"
        string5 = "testt"
        string6 = "bla"
        string7 = "_"
        string8 = "testtest"
        string9 = "   "

        self.assertEqual(marker1.match(string1), POT_MATCH)
        self.assertEqual(marker1.match(string2), MATCH)
        self.assertEqual(marker1.match(string3), NO_MATCH)
        self.assertEqual(marker1.match(string7), NO_MATCH)
        self.assertEqual(marker1.match(string9), MATCH)

        self.assertEqual(marker2.match(string1), POT_MATCH)
        self.assertEqual(marker2.match(string2), NO_MATCH)
        self.assertEqual(marker2.match(string3), MATCH)
        self.assertEqual(marker2.match(string4), POT_MATCH)
        self.assertEqual(marker2.match(string5), POT_MATCH)
        self.assertEqual(marker2.match(string6), NO_MATCH)
        self.assertEqual(marker2.match(string8), MATCH)

        with self.assertRaises(ValueError):
            RepeatableMarker("")


class TestOptionalRepeatableMarker(unittest.TestCase):
    def test_match(self):
        marker1 = OptionalRepeatableMarker(" ")
        marker2 = OptionalRepeatableMarker("test")

        string1 = ""
        string2 = " "
        string3 = "test"
        string4 = "tes"
        string5 = "testt"
        string6 = "bla"
        string7 = "_"
        string8 = "testtest"
        string9 = "   "

        self.assertEqual(marker1.match(string1), POT_MATCH)
        self.assertEqual(marker1.match(string2), MATCH)
        self.assertEqual(marker1.match(string3), NO_MATCH)
        self.assertEqual(marker1.match(string7), NO_MATCH)
        self.assertEqual(marker1.match(string9), MATCH)

        self.assertEqual(marker2.match(string1), POT_MATCH)
        self.assertEqual(marker2.match(string2), NO_MATCH)
        self.assertEqual(marker2.match(string3), MATCH)
        self.assertEqual(marker2.match(string4), POT_MATCH)
        self.assertEqual(marker2.match(string5), POT_MATCH)
        self.assertEqual(marker2.match(string6), NO_MATCH)
        self.assertEqual(marker2.match(string8), MATCH)

        with self.assertRaises(ValueError):
            OptionalRepeatableMarker("")


class TestMultiplePossibleMarkers(unittest.TestCase):
    def test_match(self):
        markers1 = MultiplePossibleMarkers([Marker("'"), Marker('"')])
        markers2 = MultiplePossibleMarkers([Marker("test"), Marker('täst')])

        string1 = "'"
        string2 = '"'
        string3 = ""
        string4 = " "
        string5 = "bla"
        string6 = "test"
        string7 = "täst"
        string8 = "t"

        self.assertEqual(markers1.match(string1), MATCH)
        self.assertEqual(markers1.match(string2), MATCH)
        self.assertEqual(markers1.match(string3), POT_MATCH)
        self.assertEqual(markers1.match(string7), NO_MATCH)
        self.assertEqual(markers1.match(string5), NO_MATCH)

        self.assertEqual(markers2.match(string1), NO_MATCH)
        self.assertEqual(markers2.match(string3), POT_MATCH)
        self.assertEqual(markers2.match(string4), NO_MATCH)
        self.assertEqual(markers2.match(string5), NO_MATCH)
        self.assertEqual(markers2.match(string6), MATCH)
        self.assertEqual(markers2.match(string7), MATCH)
        self.assertEqual(markers2.match(string8), POT_MATCH)

        with self.assertRaises(ValueError):
            MultiplePossibleMarkers([])

        with self.assertRaises(ValueError):
            MultiplePossibleMarkers([Marker(""), Marker("")])

        with self.assertRaises(ValueError):
            MultiplePossibleMarkers([Marker("test"), Marker("hey")])

        with self.assertRaises(TypeError):
            MultiplePossibleMarkers(["hey", "ho"])

        with self.assertRaises(TypeError):
            MultiplePossibleMarkers([RepeatableMarker("bla"), OptionalMarker("bla")])


class TestNewLineOrEnd(unittest.TestCase):
    def test_match(self):
        new_line_or_end = NewlineOrEnd()

        self.assertEqual(new_line_or_end.match("\n"), MATCH)
        self.assertEqual(new_line_or_end.match(""), MATCH)
        self.assertEqual(new_line_or_end.match("bla"), NO_MATCH)


class TestMarkerSequence(unittest.TestCase):
    def test_match(self):
        marker_sequence1 = MarkerSequence([Marker("{{"), OptionalRepeatableMarker(" "), Marker("test"),
                                           OptionalRepeatableMarker(" "), Marker("("), Marker("'")])

        self.assertEqual(marker_sequence1.match("{{test('"), MATCH)
        self.assertEqual(marker_sequence1.match("{{ test('"), MATCH)
        self.assertEqual(marker_sequence1.match("{{   test('"), MATCH)
        self.assertEqual(marker_sequence1.match("{{   test( '"), NO_MATCH)
        self.assertEqual(marker_sequence1.match("{{{{   test('"), NO_MATCH)
        self.assertEqual(marker_sequence1.match("{{{{   test("), NO_MATCH)
        self.assertEqual(marker_sequence1.match("{   test( '"), NO_MATCH)
        self.assertEqual(marker_sequence1.match(""), POT_MATCH)
        self.assertEqual(marker_sequence1.match("{"), POT_MATCH)
        self.assertEqual(marker_sequence1.match("{   test'"), NO_MATCH)

        marker_sequence2 = MarkerSequence([OptionalRepeatableMarker(" "), Marker("hey"), Marker(".")])

        self.assertEqual(marker_sequence2.match("blub"), NO_MATCH)
        self.assertEqual(marker_sequence2.match("hey."), MATCH)
        self.assertEqual(marker_sequence2.match(" hey"), POT_MATCH)
        self.assertEqual(marker_sequence2.match("  "), POT_MATCH)
        self.assertEqual(marker_sequence2.match(" "), POT_MATCH)
        self.assertEqual(marker_sequence2.match("      hey."), MATCH)
        self.assertEqual(marker_sequence2.match("      hey"), POT_MATCH)

        marker_sequence3 = MarkerSequence([RepeatableMarker("."), Marker("hey"), OptionalRepeatableMarker("!")])

        self.assertEqual(marker_sequence3.match(".hey"), MATCH)
        self.assertEqual(marker_sequence3.match("...hey!!"), MATCH)
        self.assertEqual(marker_sequence3.match(".he"), POT_MATCH)
        self.assertEqual(marker_sequence3.match("..hey!!!!!"), MATCH)
        self.assertEqual(marker_sequence3.match("h"), NO_MATCH)

        marker_sequence4 = MarkerSequence([Marker(":)"), RepeatableMarker(" "), Marker("what's up"),
                                           RepeatableMarker("?")])

        self.assertEqual(marker_sequence4.match(":) what's up?"), MATCH)

        marker_sequence5 = MarkerSequence([OptionalRepeatableMarker("b"), OptionalRepeatableMarker("#"),
                                           OptionalRepeatableMarker("d")])

        self.assertEqual(marker_sequence5.match("bbbbbbbbbbb#"), POT_MATCH)
        self.assertEqual(marker_sequence5.match("bbbbbbbbbbb#d"), MATCH)
        self.assertEqual(marker_sequence5.match("bbbbbbbbbbb#dddd"), MATCH)
        self.assertEqual(marker_sequence5.match("bbbbbbbbbbb#dddT"), NO_MATCH)
        self.assertEqual(marker_sequence5.match("bbbbbbbbbbb#@"), NO_MATCH)

        marker_sequence6 = MarkerSequence([OptionalRepeatableMarker("test"), OptionalRepeatableMarker("#"),
                                           OptionalRepeatableMarker("hey")])

        self.assertEqual(marker_sequence6.match("testtest##he"), POT_MATCH)
        self.assertEqual(marker_sequence6.match("testtest##heyhey"), MATCH)
        self.assertEqual(marker_sequence6.match("testtest##he1"), NO_MATCH)
        self.assertEqual(marker_sequence6.match("testtest##hey1"), NO_MATCH)

        marker_sequence6 = MarkerSequence([OptionalRepeatableMarker("test"), OptionalRepeatableMarker("#"),
                                           OptionalRepeatableMarker("hey"), Marker("hui")])

        self.assertEqual(marker_sequence6.match("testtest##heyhui"), MATCH)

        marker_sequence6 = MarkerSequence([OptionalRepeatableMarker("test"), OptionalRepeatableMarker("#"),
                                           OptionalRepeatableMarker("hey"), RepeatableMarker("hui")])

        self.assertEqual(marker_sequence6.match("testtest##heyhui"), MATCH)
        self.assertEqual(marker_sequence6.match("testtest##heyhui "), NO_MATCH)
        self.assertEqual(marker_sequence6.match("testtest##heyhuihui "), NO_MATCH)
        self.assertEqual(marker_sequence6.match("testtest##heyhuihui"), MATCH)
        self.assertEqual(marker_sequence6.match("testtestheyhuihui"), MATCH)

        marker_sequence7 = MarkerSequence([Marker("test"), MultiplePossibleMarkers([Marker("'"), Marker("\"")])])

        self.assertEqual(marker_sequence7.match("test'"), MATCH)
        self.assertEqual(marker_sequence7.match("test\""), MATCH)
        self.assertEqual(marker_sequence7.match("test\"t"), NO_MATCH)

        marker_sequence7 = MarkerSequence([Marker("test"), MultiplePossibleMarkers([Marker("hey"), Marker("hoo")])])

        self.assertEqual(marker_sequence7.match("testhey"), MATCH)
        self.assertEqual(marker_sequence7.match("testhoo"), MATCH)
        self.assertEqual(marker_sequence7.match("testh"), POT_MATCH)
        self.assertEqual(marker_sequence7.match("testha"), NO_MATCH)

        self.assertEqual(MarkerSequence([Marker("{")]).match("{{"), NO_MATCH)

        marker_sequence8 = MarkerSequence([Marker("hey"), RepeatableMarker("ho")])
        self.assertEqual(marker_sequence8.match("heyhohoho"), MATCH)
        self.assertEqual(marker_sequence8.match("heyhohoh"), POT_MATCH)
        self.assertEqual(marker_sequence8.match("heyhohoha"), NO_MATCH)

        with self.assertRaises(ValueError):
            MarkerSequence([])

        marker_sequence9 = MarkerSequence([RepeatableMarker("he"), Marker("!")])
        self.assertEqual(marker_sequence9.match("hehehe!"), MATCH)


class TestReplacer(unittest.TestCase):
    def test_replace(self):
        replacer1 = Replacer([(MarkerSequence([Marker("hey")]), MarkerSequence([Marker("ho")]),
                               lambda string, _, __: (string.upper(), REPLACE_TARGET))])
        self.assertEqual(replacer1.replace("heytollhoheytollho"), "heyTOLLhoheyTOLLho")

        replacer2 = Replacer([(MarkerSequence([Marker("hey")]), MarkerSequence([Marker("ho")]),
                               lambda string, _, __: (string.upper(), REPLACE_TARGET_AND_MARKER_SEQUENCE))])
        self.assertEqual(replacer2.replace("heytollhoheytollho"), "TOLLTOLL")
        self.assertEqual(replacer2.replace("heytollhoblaheytollho"), "TOLLblaTOLL")

        replacer3 = Replacer([(MarkerSequence([Marker("hey")]), MarkerSequence([Marker("ho")]),
                               lambda string, _, __: (string.upper(), REPLACE_TARGET_AND_MARKER_SEQUENCE_BEFORE))])
        self.assertEqual(replacer3.replace("heytollhoheytollhobla"), "TOLLhoTOLLhobla")

        replacer4 = Replacer([(MarkerSequence([Marker("hey"), RepeatableMarker("ho")]),
                               MarkerSequence([NewlineOrEnd()]), ("test", REPLACE_TARGET))])
        self.assertEqual(replacer4.replace("heyhoblub"), "heyhotest")

        replacer5 = Replacer([(MarkerSequence([Marker("hey"), RepeatableMarker("ho")]),
                               MarkerSequence([Marker("ha")]), ("test", REPLACE_TARGET))])
        self.assertEqual(replacer5.replace("heyhohohohablub"), "heyhohohotesthablub")

        replacer6 = Replacer([(MarkerSequence([Marker("ha"), RepeatableMarker("ho")]),
                               MarkerSequence([RepeatableMarker("he")]), ("test", REPLACE_TARGET))])
        self.assertEqual(replacer6.replace("bla hahohoUAhehehe bla"), "bla hahohotesthehehe bla")

        replacer8 = Replacer([(MarkerSequence([Marker("ha"), RepeatableMarker("ho")]),
                               MarkerSequence([RepeatableMarker("he"), Marker("!")]), ("test", REPLACE_TARGET))])
        self.assertEqual(replacer8.replace("bla hahohoUAhehehe! bla"), "bla hahohotesthehehe! bla")

        replacer9 = Replacer([(MarkerSequence([Marker("haha"), RepeatableMarker("ho")]),
                               MarkerSequence([RepeatableMarker("he"), Marker("!")]), (":)", REPLACE_TARGET)),
                              (MarkerSequence([Marker("ha"), RepeatableMarker("ho")]),
                               MarkerSequence([RepeatableMarker("he"), Marker("!")]),
                               ("test", REPLACE_TARGET_AND_MARKER_SEQUENCE))])
        self.assertEqual(replacer9.replace("bla hahahohoUAhehehe!hahohoUAhehehe! bla"), "bla hahahoho:)hehehe!test bla")

        replacer10 = Replacer([(MarkerSequence([Marker("ha"), RepeatableMarker("ho")]),
                                MarkerSequence([OptionalRepeatableMarker("he"), Marker("!")]),
                                ("test", REPLACE_TARGET))])
        self.assertEqual(replacer10.replace("bla hahohoUA! bla"), "bla hahohotest! bla")
        self.assertEqual(replacer10.replace("bla hahohoheUAhe! bla"), "bla hahohotesthe! bla")
        self.assertEqual(replacer10.replace("bla hahohoheUAhehe! bla"), "bla hahohotesthehe! bla")

        replacer11 = Replacer([(MarkerSequence([Marker("ha")]), MarkerSequence([OptionalRepeatableMarker("he")]),
                                ("test", REPLACE_TARGET))])
        self.assertEqual(replacer11.replace("haheyhehe"), "hatestheyhehe")
        self.assertEqual(replacer11.replace("hahobla"), "hahobla")

        replacer11 = Replacer([(MarkerSequence([Marker("ha")]), MarkerSequence([OptionalRepeatableMarker("he"),
                                                                                Marker("!")]),
                                ("test", REPLACE_TARGET))])
        self.assertEqual(replacer11.replace("haho!bla"), "hatest!bla")
        self.assertEqual(replacer11.replace("hahohehe!bla"), "hatesthehe!bla")

        replacer12 = Replacer([(MarkerSequence([Marker("hey")]), MarkerSequence([Marker("ho")]),
                                lambda string, _, __: (string.upper(), REPLACE_TARGET_AND_MARKER_SEQUENCE_AFTER))])
        self.assertEqual(replacer12.replace("heytollhoheytollhobla"), "heyTOLLheyTOLLbla")

        before = [Marker("{{"),
                  OptionalRepeatableMarker(" "),
                  Marker("static_url"),
                  OptionalRepeatableMarker(" "),
                  Marker("("),
                  OptionalRepeatableMarker(" "),
                  MultiplePossibleMarkers([Marker("'"), Marker("\"")])]

        after = [MultiplePossibleMarkers([Marker("'"), Marker("\"")]),
                 OptionalRepeatableMarker(" "),
                 Marker(")"),
                 OptionalRepeatableMarker(" "),
                 Marker("}}")]

        replacer13 = Replacer([(MarkerSequence(before),
                               MarkerSequence(after),
                               lambda target, _, __: (target.upper(), REPLACE_TARGET))])

        str1 = "test hey ho bla bla {{ static_url('h') }} blub"
        correctly_processed_str1 = "test hey ho bla bla {{ static_url('H') }} blub"
        self.assertEqual(replacer13.replace(str1), correctly_processed_str1)

        str2 = "test hey ho bla bla {{ static_url('h') }} blub{{static_url(  'hey')}} {{ blob({{static_url('hey' )}} "
        correctly_processed_str2 = "test hey ho bla bla {{ static_url('H') }} " \
                                   "blub{{static_url(  'HEY')}} {{ blob({{static_url('HEY' )}} "
        self.assertEqual(replacer13.replace(str2), correctly_processed_str2)


class TestGetter(unittest.TestCase):
    def test_get(self):
        getter1 = Getter([(MarkerSequence([Marker("hey")]), MarkerSequence([Marker("ho")]), lambda _, __, ___: _)])
        self.assertEqual(getter1.get("heytesthohabla"), ["test"])

        getter2 = Getter([(MarkerSequence([Marker("hey")]), MarkerSequence([Marker("ho")]), lambda _, __, ___: None)])
        self.assertEqual(getter2.get("heytesthohabla"), [])


if __name__ == '__main__':
    unittest.main()
