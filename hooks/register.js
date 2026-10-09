"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.withAnnotations = exports.toMarkdown = void 0;
var claude_code_1 = require("claude-code");
var annotations = (0, claude_code_1.atom)({ plugin: 'annotate', key: 'annotations' }, []);
var selection = (0, claude_code_1.atom)({ plugin: 'annotate', key: 'selection' }, null);
var pending = (0, claude_code_1.atom)({ plugin: 'annotate', key: 'pending' }, null);
// The selection last annotated: the terminal keeps it after the prompt is sent.
var used = (0, claude_code_1.atom)({ plugin: 'annotate', key: 'used' }, null);
var nextId = (0, claude_code_1.atom)({ plugin: 'annotate', key: 'nextId' }, 1);
var POLL_MS = 400;
var quoteLines = function (text) {
    return text
        .split('\n')
        .map(function (line) { return "> ".concat(line); })
        .join('\n');
};
var toMarkdown = function (list) {
    return __spreadArray([
        'Feedback on your previous response:'
    ], list.map(function (one, i) { return "".concat(i + 1, ".\n").concat(quoteLines(one.quote), "\n\n").concat(one.comment); }), true).join('\n\n');
};
exports.toMarkdown = toMarkdown;
var preview = function (text, width) {
    var flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > width ? "".concat(flat.slice(0, Math.max(1, width - 1)), "\u2026") : flat;
};
// Selected text is what the terminal drew, the message text is markdown:
// compare both without markup, bullets or spacing.
var normalize = function (text) {
    return text
        .replace(/[*_`#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
};
var anchorOf = function (quote) {
    var _a;
    var first = (_a = quote.split('\n').find(function (line) { return line.trim(); })) !== null && _a !== void 0 ? _a : '';
    return normalize(first.replace(/^\s*([•·●⏺*-]|\d+\.)\s+/, '')).slice(0, 60);
};
/**
 * Inserts each annotation's comment after the paragraph (or code block) its
 * quote starts in. Annotations whose quote isn't found are left out.
 */
var withAnnotations = function (text, list) {
    var _a, _b;
    var lines = text.split('\n');
    var inFence = [];
    var isOpen = false;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var isFence = /^\s*(```|~~~)/.test(line);
        inFence.push(isOpen || isFence);
        if (isFence)
            isOpen = !isOpen;
    }
    var after = new Map();
    var _loop_1 = function (one) {
        var anchor = anchorOf(one.quote);
        if (!anchor)
            return "continue";
        var start = lines.findIndex(function (line) { return normalize(line).includes(anchor); });
        if (start < 0)
            return "continue";
        var end = start;
        while (end + 1 < lines.length && (((_a = lines[end + 1]) === null || _a === void 0 ? void 0 : _a.trim()) !== '' || inFence[end + 1]))
            end++;
        after.set(end, __spreadArray(__spreadArray([], ((_b = after.get(end)) !== null && _b !== void 0 ? _b : []), true), ["> \uD83D\uDCAC **".concat(one.comment, "**")], false));
    };
    for (var _c = 0, list_1 = list; _c < list_1.length; _c++) {
        var one = list_1[_c];
        _loop_1(one);
    }
    if (after.size === 0)
        return text;
    return lines
        .flatMap(function (line, i) {
        var comments = after.get(i);
        return comments ? __spreadArray([line, ''], comments.flatMap(function (c) { return [c, '']; }), true) : [line];
    })
        .join('\n')
        .trimEnd();
};
exports.withAnnotations = withAnnotations;
// Replies drawn through next(e) aren't redrawn by the state write alone.
var setAnnotations = function ($, fn) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, claude_code_1.update)($, annotations, fn)];
            case 1:
                _a.sent();
                $.ui.invalidate('ui.render');
                return [2 /*return*/];
        }
    });
}); };
var isSame = function (a, b) {
    return (a === null || a === void 0 ? void 0 : a.quote) === (b === null || b === void 0 ? void 0 : b.quote) && (a === null || a === void 0 ? void 0 : a.rowId) === (b === null || b === void 0 ? void 0 : b.rowId);
};
var PANE = 'annotate';
var TITLE = 'Annotations';
// Docked width in columns; a width the person drags to wins.
var COLUMNS = 40;
var register = function (on) {
    on('session.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.command.register({
                        name: 'annotate-mod',
                        description: 'Toggle the Annotations pane',
                    })];
                case 1:
                    _a.sent();
                    void $.ui.open({ id: PANE, title: TITLE, columns: COLUMNS });
                    $.clock.every(POLL_MS, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var selected, quote, found, last, value, _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, $.ui.selection()];
                                case 1:
                                    selected = _c.sent();
                                    quote = selected === null || selected === void 0 ? void 0 : selected.text.trim();
                                    found = quote
                                        ? __assign({ quote: quote }, ((selected === null || selected === void 0 ? void 0 : selected.requestId) ? { rowId: selected.requestId } : {})) : null;
                                    return [4 /*yield*/, (0, claude_code_1.read)($, used)];
                                case 2:
                                    last = _c.sent();
                                    if (!(last && !isSame(found, last))) return [3 /*break*/, 4];
                                    return [4 /*yield*/, (0, claude_code_1.update)($, used, function () { return null; })];
                                case 3:
                                    _c.sent();
                                    _c.label = 4;
                                case 4:
                                    value = last && isSame(found, last) ? null : found;
                                    _a = isSame;
                                    _b = [value];
                                    return [4 /*yield*/, (0, claude_code_1.read)($, selection)];
                                case 5:
                                    if (!!_a.apply(void 0, _b.concat([_c.sent()]))) return [3 /*break*/, 7];
                                    return [4 /*yield*/, (0, claude_code_1.update)($, selection, function () { return value; })];
                                case 6:
                                    _c.sent();
                                    _c.label = 7;
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('command.run', { command: 'annotate-mod' }, function ($) { return __awaiter(void 0, void 0, void 0, function () {
        var isShown;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.ui.panes()];
                case 1:
                    isShown = (_a.sent()).some(function (pane) { return pane.id === PANE && pane.isShown; });
                    if (!isShown) return [3 /*break*/, 3];
                    return [4 /*yield*/, $.ui.close({ id: PANE })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { text: 'Annotations pane closed.' }];
                case 3: return [4 /*yield*/, $.ui.open({ id: PANE, title: TITLE, columns: COLUMNS, focus: true })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, { text: 'Annotations pane opened.' }];
            }
        });
    }); });
    on('ui.render', { component: 'AssistantMessage' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var list, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, claude_code_1.read)($, annotations)];
                case 1:
                    list = (_a.sent()).filter(function (a) { return !a.rowId || a.rowId === e.requestId; });
                    text = list.length > 0 ? (0, exports.withAnnotations)(e.props.text, list) : e.props.text;
                    return [2 /*return*/, text === e.props.text ? next(e) : next(__assign(__assign({}, e), { props: __assign(__assign({}, e.props), { text: text }) }))];
            }
        });
    }); });
    on('ui.render', { component: 'Pane', requestId: PANE }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var list, draft, selected, elements, Box, Text, Button, Input, width, startAnnotation, saveAnnotation, send, copy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, claude_code_1.read)($, annotations)];
                case 1:
                    list = _a.sent();
                    return [4 /*yield*/, (0, claude_code_1.read)($, pending)];
                case 2:
                    draft = _a.sent();
                    return [4 /*yield*/, (0, claude_code_1.read)($, selection)];
                case 3:
                    selected = _a.sent();
                    elements = $.ui.resolve(e);
                    Box = elements.Box, Text = elements.Text, Button = elements.Button;
                    Input = 'Input' in elements ? elements.Input : undefined;
                    width = Math.max(10, e.props.bodyColumns - 4);
                    startAnnotation = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var current;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, claude_code_1.read)($, selection)];
                                case 1:
                                    current = _a.sent();
                                    if (!current) {
                                        $.ui.toast('Select text in the transcript first');
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, (0, claude_code_1.update)($, pending, function () { return current; })
                                        // Best effort: the ring stays put when the pane doesn't hold the keys.
                                    ];
                                case 2:
                                    _a.sent();
                                    // Best effort: the ring stays put when the pane doesn't hold the keys.
                                    void $.ui.focus({ requestId: PANE, key: 'comment' }).catch(function () { return undefined; });
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    saveAnnotation = function (comment) { return __awaiter(void 0, void 0, void 0, function () {
                        var text, current, id;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    text = comment.trim();
                                    return [4 /*yield*/, (0, claude_code_1.read)($, pending)];
                                case 1:
                                    current = _a.sent();
                                    if (!text || !current)
                                        return [2 /*return*/];
                                    return [4 /*yield*/, (0, claude_code_1.read)($, nextId)];
                                case 2:
                                    id = _a.sent();
                                    return [4 /*yield*/, (0, claude_code_1.update)($, nextId, function (n) { return n + 1; })];
                                case 3:
                                    _a.sent();
                                    return [4 /*yield*/, setAnnotations($, function (all) { return __spreadArray(__spreadArray([], all, true), [__assign(__assign({}, current), { id: id, comment: text })], false); })];
                                case 4:
                                    _a.sent();
                                    return [4 /*yield*/, (0, claude_code_1.update)($, used, function () { return current; })];
                                case 5:
                                    _a.sent();
                                    return [4 /*yield*/, (0, claude_code_1.update)($, pending, function () { return null; })];
                                case 6:
                                    _a.sent();
                                    return [4 /*yield*/, (0, claude_code_1.update)($, selection, function () { return null; })];
                                case 7:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    send = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var all;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, claude_code_1.read)($, annotations)];
                                case 1:
                                    all = _a.sent();
                                    if (all.length === 0)
                                        return [2 /*return*/];
                                    return [4 /*yield*/, setAnnotations($, function () { return []; })];
                                case 2:
                                    _a.sent();
                                    void $.prompt.submit({ text: (0, exports.toMarkdown)(all), asUser: true });
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    copy = function (surface) { return __awaiter(void 0, void 0, void 0, function () {
                        var result, _a, _b, _c;
                        var _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _b = (_a = $.ui).copy;
                                    _d = {};
                                    _c = exports.toMarkdown;
                                    return [4 /*yield*/, (0, claude_code_1.read)($, annotations)];
                                case 1: return [4 /*yield*/, _b.apply(_a, [(_d.text = _c.apply(void 0, [_e.sent()]), _d.surface = surface, _d)])];
                                case 2:
                                    result = _e.sent();
                                    $.ui.toast(result.isCopied ? 'Annotations copied as Markdown' : "Copy failed: ".concat(result.reason));
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [2 /*return*/, (<Box flexDirection="column">
        {draft ? (<Box flexDirection="column">
            <Text dimColor>{quoteLines(preview(draft.quote, width - 2))}</Text>
            {Input ? (<Input key="comment" placeholder="Your comment" submitLabel="add" autoFocus onSubmit={saveAnnotation}/>) : (<Text dimColor>No text field on this surface.</Text>)}
            <Button key="cancel" label="Cancel" plain onPress={function () { return (0, claude_code_1.update)($, pending, function () { return null; }); }}/>
          </Box>) : (<Box flexDirection="column">
            <Text dimColor>
              {selected ? quoteLines(preview(selected.quote, width - 2)) : 'Select text in the transcript to annotate it.'}
            </Text>
            <Box>
              <Button key="annotate" label="Annotate" hotkey="a" variant="primary" onPress={startAnnotation}/>
            </Box>
          </Box>)}

        {list.length > 0 && (<Box flexDirection="column" marginTop={1}>
            {list.map(function (one, i) { return (<Box key={"row:".concat(one.id)} flexDirection="column" marginBottom={1}>
                <Text dimColor>{"".concat(i + 1, ". > ").concat(preview(one.quote, width - 5))}</Text>
                <Box>
                  <Text>{"   \uD83D\uDCAC ".concat(one.comment, " ")}</Text>
                  <Button key={"remove:".concat(one.id)} label="x" onPress={function () { return setAnnotations($, function (all) { return all.filter(function (a) { return a.id !== one.id; }); }); }}/>
                </Box>
              </Box>); })}
            <Box>
              <Button key="send" label={"Send ".concat(list.length)} hotkey="s" variant="primary" onPress={send}/>
              <Button key="copy" label="Copy" hotkey="c" onPress={function (press) { return copy(press.surface); }}/>
              <Button key="clear" label="Clear" onPress={function () { return setAnnotations($, function () { return []; }); }}/>
            </Box>
          </Box>)}
      </Box>)];
            }
        });
    }); });
};
exports.register = register;
