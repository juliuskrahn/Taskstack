from typing import List, Sequence, Tuple, Callable, Optional, Union, NoReturn

NO_MATCH = 0
POT_MATCH = 1
MATCH = 2

REPLACE_TARGET = 1
REPLACE_TARGET_AND_MARKER_SEQUENCE = 2
REPLACE_TARGET_AND_MARKER_SEQUENCE_BEFORE = 3
REPLACE_TARGET_AND_MARKER_SEQUENCE_AFTER = 4


class Marker(str):
    def __init__(self, val: str):
        if val == "":
            raise ValueError(f"{type(self)} can't be an empty string")
        super().__init__()

    def match(self, current_string: str) -> int:
        if self == current_string:
            return MATCH

        elif current_string == "":
            return POT_MATCH

        elif len(current_string) < len(self) and self.startswith(current_string):
            return POT_MATCH

        return NO_MATCH


class OptionalMarker(Marker):
    pass


class RepeatableMarker(str):
    def __init__(self, val: str):
        if val == "":
            raise ValueError(f"{type(self)} can't be an empty string")
        super().__init__()

    def match(self, current_string: str) -> int:
        if current_string == "":
            return POT_MATCH

        pos = 0
        while len(current_string) >= pos + len(self):
            if current_string[pos:pos + len(self)] == self:
                pos += len(self)
            else:
                return NO_MATCH

        else:  # while loop condition false
            if len(current_string[pos:]) >= 1:
                if self.startswith(current_string[pos:]):
                    return POT_MATCH
                return NO_MATCH

        return MATCH


class OptionalRepeatableMarker(RepeatableMarker):
    pass


class MultiplePossibleMarkers(list):
    def __init__(self, marker_list: List[Marker]):
        if len(marker_list) < 2:
            raise ValueError(f"{type(self)} must contain at least 2 markers")

        val_len = len(marker_list[0])
        for marker in marker_list:
            if not isinstance(marker, Marker):
                raise TypeError(f"Expected type {Marker}, got {type(marker)} instead")
            if val_len != len(marker):
                raise ValueError(f"Every marker of {type(self)} has to be equally long")

        super().__init__(marker_list)

    def match(self, current_string: str) -> int:
        one_marker_pot_matched = False

        for marker in self:
            match = marker.match(current_string)
            if match == MATCH:
                return MATCH
            elif match == POT_MATCH:
                one_marker_pot_matched = True

        if one_marker_pot_matched:
            return POT_MATCH
        return NO_MATCH


class NewlineOrEnd:
    @staticmethod
    def match(current_string: str) -> int:
        if current_string == "\n" or current_string == "":
            return MATCH
        return NO_MATCH


class MarkerSequence(list):
    def __init__(self, marker_list: Sequence[Union[Marker, OptionalMarker, RepeatableMarker, OptionalRepeatableMarker,
                                                   MultiplePossibleMarkers, NewlineOrEnd]]):
        if len(marker_list) == 0:
            raise ValueError(f"{type(self)} can't be an empty list")
        super().__init__(marker_list)

    def match(self, current_string: str) -> int:
        if current_string == "":
            if isinstance(self[0], NewlineOrEnd) or self[0] == NewlineOrEnd:
                return MATCH
            return POT_MATCH

        marker_i = 0

        expect_marker_to_start_pos = 0
        scan_pos = 0

        marker_matched_end_pos = None

        match = NO_MATCH

        while scan_pos <= len(current_string) and marker_i < len(self) + 1:
            to_scan = current_string[expect_marker_to_start_pos:scan_pos + 1]

            if to_scan == "":
                try:
                    if (isinstance(self[marker_i], OptionalMarker)
                        or isinstance(self[marker_i], OptionalRepeatableMarker)) \
                            and to_scan == "":
                        match = MATCH
                        marker_i += 1
                    break
                except IndexError:
                    break

            try:
                match = self[marker_i].match(to_scan)
            except IndexError:
                return NO_MATCH

            if match == MATCH:
                if isinstance(self[marker_i], RepeatableMarker) \
                        or isinstance(self[marker_i], OptionalRepeatableMarker):
                    marker_matched_end_pos = scan_pos

                    if scan_pos + len(self[marker_i]) >= len(current_string):
                        if current_string[scan_pos + 1:] == "":
                            pass
                        elif len(current_string[scan_pos + 1:]) < len(self[marker_i]):
                            if self[marker_i].startswith(current_string[scan_pos + 1:]):
                                match = POT_MATCH
                            else:
                                match = NO_MATCH
                        else:
                            if current_string[scan_pos + 1:].startswith(self[marker_i]):
                                match = POT_MATCH
                            else:
                                match = NO_MATCH
                        marker_i += 1
                        if match == NO_MATCH and len(self) > marker_i:
                            if self[marker_i].match(current_string[scan_pos + 1:]) == MATCH:
                                match = MATCH
                                marker_i += 1
                        break

                else:
                    marker_i += 1
                    expect_marker_to_start_pos = scan_pos + 1

            elif match == NO_MATCH:
                if marker_matched_end_pos is not None:
                    scan_pos, marker_matched_end_pos = marker_matched_end_pos, None
                    marker_i += 1
                    expect_marker_to_start_pos = scan_pos + 1
                    match = MATCH

                elif isinstance(self[marker_i], OptionalMarker) \
                        or isinstance(self[marker_i], OptionalRepeatableMarker):
                    marker_i += 1
                    scan_pos = expect_marker_to_start_pos
                    match = MATCH
                    continue

                else:
                    break

            scan_pos += 1

        if marker_i < len(self) and match == MATCH:
            return POT_MATCH
        return match


class MatchCollection(list):
    def remove_and_get_item_by_arg_if_contain(self, arg: Tuple[MarkerSequence,
                                                               MarkerSequence,
                                                               Optional[Union[Callable[[str, str, str],
                                                                                       Tuple[str, int]],
                                                                              Tuple[str, int],
                                                                        Callable[[str, str, str], Union[str, None]]]]])\
            -> Union[Tuple[int, Tuple[MarkerSequence, MarkerSequence, Optional[Union[Callable[[str, str, str],
                                                                                              Tuple[str, int]],
                                                                                     Tuple[str, int],
                                                                               Callable[[str, str, str],
                                                                                        Union[str, None]]]]]],
                     None]:

        for index, item in enumerate(self):
            if item[1] == arg:
                return self.pop(index)
        return None

    def append_item_or_if_contain_arg_replace(self, new_item: Tuple[int,
                                                                    Tuple[MarkerSequence,
                                                                          MarkerSequence,
                                                                          Optional[
                                                                              Union[Callable[[str, str, str],
                                                                                             Tuple[str, int]],
                                                                                    Tuple[str, int],
                                                                                    Callable[[str, str, str],
                                                                                             Union[str, None]]]]]]) \
            -> NoReturn:

        for index, item in enumerate(self):
            if item[1] == new_item[1]:
                self[index] = new_item
                break
        else:  # no break
            self.append(new_item)

    def get_item_with_longest_before_target_marker_sequence(self) \
            -> Union[Tuple[int, Tuple[MarkerSequence,
                                      MarkerSequence,
                                      Optional[Union[Callable[[str, str, str], Tuple[str, int]], Tuple[str, int],
                                                     Callable[[str, str, str], Union[str, None]]]]]],
                     None]:

        try:
            best = self[0]
            for item in self:
                if len(item[1][0]) > len(best[1][0]):
                    best = item
            return best
        except IndexError:
            return None


class Replacer:
    def __init__(self, args: List[Tuple[MarkerSequence, MarkerSequence,
                                        Union[Callable[[str, str, str], Tuple[str, int]], Tuple[str, int]]]]):
        """
            :param args: argument tuple ->
                1. item: MarkerSequence that marks the beginning of a target
                2. item: MarkerSequence that marks the end of a target
                3. item: - a func that takes the target string, the marker string before the target,
                           the marker string after the target as parameters and returns a tuple:
                            (<replace string>, <replace rule>)
                         or - a tuple:
                           (<replace string>, <replace rule>)
        """

        self.args = args

        self._string = ""

        self._string_out = ""

        self._base_pos = 0

        self._scan_pos = 0  # relative to self._base_pos

        self._matches: MatchCollection[Tuple[int,
                                             Tuple[MarkerSequence,
                                                   MarkerSequence,
                                                   Union[Callable[[str, str, str], Tuple[str, int]],
                                                         Tuple[str, int]]]]] \
            = MatchCollection()

        self._prev_matches: MatchCollection[Tuple[int,
                                                  Tuple[MarkerSequence,
                                                        MarkerSequence,
                                                        Union[Callable[[str, str, str], Tuple[str, int]],
                                                              Tuple[str, int]]]]] \
            = MatchCollection()

        self._pot_matches: MatchCollection[Tuple[int,
                                                 Tuple[MarkerSequence,
                                                       MarkerSequence,
                                                       Union[Callable[[str, str, str], Tuple[str, int]],
                                                             Tuple[str, int]]]]] \
            = MatchCollection()

    def replace(self, string: str) -> str:
        self._string = string
        self._string_out = ""
        self._base_pos = 0
        self._scan_pos = 0
        self._matches.clear()
        self._prev_matches.clear()
        self._pot_matches.clear()

        while self._base_pos < len(self._string) and self._base_pos + self._scan_pos < len(self._string):

            for arg in self.args:

                match = arg[0].match(self._current_text)

                if match == MATCH:
                    self._matches.append_item_or_if_contain_arg_replace((self._scan_pos, arg))

                elif match == POT_MATCH:
                    self._pot_matches.append_item_or_if_contain_arg_replace((self._scan_pos, arg))
                    item = self._matches.remove_and_get_item_by_arg_if_contain(arg)
                    if item is not None:
                        self._prev_matches.append_item_or_if_contain_arg_replace(item)

                elif match == NO_MATCH:
                    self._pot_matches.remove_and_get_item_by_arg_if_contain(arg)
                    item = self._matches.remove_and_get_item_by_arg_if_contain(arg)
                    if item is not None:
                        self._prev_matches.append_item_or_if_contain_arg_replace(item)

            if len(self._pot_matches) > 0 and self._base_pos + self._scan_pos < len(self._string):
                self._advance_scan_pos()
                continue

            elif len(self._matches) >= 1:
                item = self._matches.get_item_with_longest_before_target_marker_sequence()
                self._process_match_item(item)

            elif len(self._prev_matches) > 0:
                item = self._prev_matches.get_item_with_longest_before_target_marker_sequence()
                self._scan_pos = item[0]
                self._process_match_item(item)

            else:
                self._string_out += self._current_text

            self._advance_base_pos()

        return self._string_out

    def _process_match_item(self, item):
        before_target_marker_sequence_start_pos = self._base_pos
        before_target_marker_sequence_scan_pos = item[0]
        arg = item[1]

        self._advance_base_pos()

        target_start_pos = self._base_pos

        target_end_scan_pos = None
        after_target_marker_sequence_matched_scan_pos = None

        while self._base_pos <= len(self._string) and self._base_pos + self._scan_pos <= len(self._string):
            match = arg[1].match(self._current_text)
            if match == MATCH:
                after_target_marker_sequence_matched_scan_pos = self._scan_pos
                if target_end_scan_pos is None:
                    target_end_scan_pos = self._base_pos - target_start_pos - 1
            elif match == NO_MATCH:
                if after_target_marker_sequence_matched_scan_pos is not None:
                    break
                else:
                    self._advance_base_pos()
                    continue
            self._advance_scan_pos()
        self._scan_pos = after_target_marker_sequence_matched_scan_pos

        if target_end_scan_pos is None:
            self._base_pos = target_start_pos
            self._scan_pos = -1
            self._string_out += self._get_text(before_target_marker_sequence_start_pos,
                                               before_target_marker_sequence_scan_pos)
            return

        if callable(arg[2]):
            got = arg[2](self._get_text(target_start_pos, target_end_scan_pos),
                         self._get_text(before_target_marker_sequence_start_pos,
                                        before_target_marker_sequence_scan_pos),
                         self._get_text(target_start_pos + 1 + target_end_scan_pos,
                                        after_target_marker_sequence_matched_scan_pos))
        else:
            got = arg[2]

        string_to_replace_target = got[0]
        rule = got[1]
        del got

        if rule == REPLACE_TARGET_AND_MARKER_SEQUENCE:
            self._string_out += string_to_replace_target

        elif rule == REPLACE_TARGET:
            self._string_out += self._get_text(before_target_marker_sequence_start_pos,
                                               before_target_marker_sequence_scan_pos) + \
                                string_to_replace_target + \
                                self._get_text(target_start_pos + 1 + target_end_scan_pos,
                                               after_target_marker_sequence_matched_scan_pos)

        elif rule == REPLACE_TARGET_AND_MARKER_SEQUENCE_BEFORE:
            self._string_out += string_to_replace_target + \
                                self._get_text(target_start_pos + 1 + target_end_scan_pos,
                                               after_target_marker_sequence_matched_scan_pos)

        elif rule == REPLACE_TARGET_AND_MARKER_SEQUENCE_AFTER:
            self._string_out += self._get_text(before_target_marker_sequence_start_pos,
                                               before_target_marker_sequence_scan_pos) + \
                                string_to_replace_target

        else:
            raise ValueError("Invalid replace rule")

    def _advance_base_pos(self) -> NoReturn:
        self._base_pos += self._scan_pos + 1
        self._scan_pos = 0
        self._matches.clear()
        self._prev_matches.clear()
        self._pot_matches.clear()

    def _advance_scan_pos(self) -> NoReturn:
        self._scan_pos += 1

    @property
    def _current_text(self) -> str:
        if self._base_pos >= len(self._string) or self._scan_pos == len(self._string):
            return ""
        return self._string[self._base_pos:self._base_pos + self._scan_pos + 1]

    def _get_text(self, base_pos: int, scan_pos: int) -> str:
        if base_pos >= len(self._string) or scan_pos == len(self._string):
            return ""
        return self._string[base_pos:base_pos + scan_pos + 1]


class Getter:
    def __init__(self, args: List[Tuple[MarkerSequence, MarkerSequence, Optional[Callable[[str, str, str],
                                                                                          Union[str, None]]]]]):
        """
            :param args: argument tuple ->
                1. item: MarkerSequence that marks the beginning of a target
                2. item: MarkerSequence that marks the end of a target
                3. item: (optional) a func that takes the target string, the marker string before the target,
                         the marker string after the target as parameters and returns a bool:
                            true -> get target | false -> skip target
        """

        self.args = args

        self._string = ""

        self._targets = []

        self._base_pos = 0

        self._scan_pos = 0  # relative to self._base_pos

        self._matches: MatchCollection[Tuple[int,
                                             Tuple[MarkerSequence,
                                                   MarkerSequence,
                                                   Optional[Callable[[str, str, str], Union[str, None]]]]]] \
            = MatchCollection()

        self._prev_matches: MatchCollection[Tuple[int,
                                                  Tuple[MarkerSequence,
                                                        MarkerSequence,
                                                        Optional[Callable[[str, str, str], Union[str, None]]]]]] \
            = MatchCollection()

        self._pot_matches: MatchCollection[Tuple[int,
                                                 Tuple[MarkerSequence,
                                                       MarkerSequence,
                                                       Optional[Callable[[str, str, str], Union[str, None]]]]]] \
            = MatchCollection()

    def get(self, string: str) -> List:
        self._string = string
        self._targets.clear()
        self._base_pos = 0
        self._scan_pos = 0
        self._matches.clear()
        self._prev_matches.clear()
        self._pot_matches.clear()

        while self._base_pos < len(self._string) and self._base_pos + self._scan_pos < len(self._string):

            for arg in self.args:

                match = arg[0].match(self._current_text)

                if match == MATCH:
                    self._matches.append_item_or_if_contain_arg_replace((self._scan_pos, arg))
                    self._pot_matches.remove_and_get_item_by_arg_if_contain(arg)

                elif match == POT_MATCH:
                    self._pot_matches.append_item_or_if_contain_arg_replace((self._scan_pos, arg))
                    item = self._matches.remove_and_get_item_by_arg_if_contain(arg)
                    if item is not None:
                        self._prev_matches.append_item_or_if_contain_arg_replace(item)

                elif match == NO_MATCH:
                    self._pot_matches.remove_and_get_item_by_arg_if_contain(arg)
                    item = self._matches.remove_and_get_item_by_arg_if_contain(arg)
                    if item is not None:
                        self._prev_matches.append_item_or_if_contain_arg_replace(item)

            if len(self._pot_matches) > 0 and self._base_pos + self._scan_pos < len(self._string):
                self._advance_scan_pos()
                continue

            elif len(self._matches) >= 1:
                item = self._matches.get_item_with_longest_before_target_marker_sequence()
                self._process_match_item(item)

            elif len(self._prev_matches) > 0:
                item = self._prev_matches.get_item_with_longest_before_target_marker_sequence()
                self._scan_pos = item[0]
                self._process_match_item(item)

            self._advance_base_pos()

        return self._targets

    def _process_match_item(self, item):
        before_target_marker_sequence_start_pos = self._base_pos
        before_target_marker_sequence_scan_pos = item[0]
        arg = item[1]

        self._advance_base_pos()

        target_start_pos = self._base_pos

        target_end_scan_pos = None
        after_target_marker_sequence_matched_scan_pos = None

        while self._base_pos <= len(self._string) and self._base_pos + self._scan_pos <= len(self._string):
            match = arg[1].match(self._current_text)
            if match == MATCH:
                after_target_marker_sequence_matched_scan_pos = self._scan_pos
                if target_end_scan_pos is None:
                    target_end_scan_pos = self._base_pos - target_start_pos - 1
            elif match == NO_MATCH:
                if after_target_marker_sequence_matched_scan_pos is not None:
                    break
                else:
                    self._advance_base_pos()
                    continue
            self._advance_scan_pos()
        self._scan_pos = after_target_marker_sequence_matched_scan_pos

        if target_end_scan_pos is None:
            self._base_pos = target_start_pos
            self._scan_pos = -1
            return

        target_string = self._get_text(target_start_pos, target_end_scan_pos)

        if len(arg) > 2:
            to_append = arg[2](self._get_text(target_start_pos, target_end_scan_pos),
                               self._get_text(before_target_marker_sequence_start_pos,
                                              before_target_marker_sequence_scan_pos),
                               self._get_text(target_start_pos + 1 + target_end_scan_pos,
                                              after_target_marker_sequence_matched_scan_pos))
        else:
            to_append = target_string

        if to_append is not None:
            self._targets.append(to_append)

    def _advance_base_pos(self) -> NoReturn:
        self._base_pos += self._scan_pos + 1
        self._scan_pos = 0
        self._matches.clear()
        self._prev_matches.clear()
        self._pot_matches.clear()

    def _advance_scan_pos(self) -> NoReturn:
        self._scan_pos += 1

    @property
    def _current_text(self) -> str:
        if self._base_pos >= len(self._string) or self._scan_pos == len(self._string):
            return ""
        return self._string[self._base_pos:self._base_pos + self._scan_pos + 1]

    def _get_text(self, base_pos: int, scan_pos: int) -> str:
        if base_pos >= len(self._string) or scan_pos == len(self._string):
            return ""
        return self._string[base_pos:base_pos + scan_pos + 1]
