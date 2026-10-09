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
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var register_1 = require("./register");
var PANE = {
    component: 'Pane',
    requestId: 'annotate',
    props: {
        title: 'Annotations',
        isFocused: true,
        bodyColumns: 60,
        placement: 'dock',
        scroll: { offset: 0, bodyRows: 30 },
        view: {},
    },
};
(0, testing_1.test)('annotates the selection from the pane and sends the comments', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var sent, clock, ui, _a, _b, _c;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                sent = [];
                clock = testing_1.mock.clock(on);
                on('session.start', function ($, e) { return ({ cwd: e.cwd }); });
                on('ui.open', function () { return ({ value: { isPlaced: true } }); });
                on('command.register', function ($, e) { return ({ value: { command: e.name } }); });
                on('ui.selection', function () { return ({ value: { text: 'Use a global cache here', requestId: 'r1' } }); });
                on('prompt.submit', function ($, e) {
                    sent.push(e.text);
                    return { drop: 'captured by test' };
                });
                return [4 /*yield*/, $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })];
            case 1:
                _e.sent();
                return [4 /*yield*/, clock.advance(500)];
            case 2:
                _e.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'annotate', surface: 'terminal' }, PANE))];
            case 3:
                ui = _e.sent();
                return [4 /*yield*/, ui.press({ key: 'annotate' })];
            case 4:
                _e.sent();
                return [4 /*yield*/, ui.input({ key: 'comment', text: 'No globals, pass it in' })];
            case 5:
                _e.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'send' })];
            case 6:
                _a.apply(void 0, [(_d = (_e.sent())) === null || _d === void 0 ? void 0 : _d.text]).toContain('Send 1');
                return [4 /*yield*/, ui.press({ key: 'send' })];
            case 7:
                _e.sent();
                (0, testing_1.expect)(sent.at(-1)).toContain('> Use a global cache here');
                (0, testing_1.expect)(sent.at(-1)).toContain('No globals, pass it in');
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'send' })];
            case 8:
                _b.apply(void 0, [_e.sent()]).toBeUndefined();
                return [4 /*yield*/, clock.advance(500)];
            case 9:
                _e.sent();
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: /Select text in the transcript/ })];
            case 10:
                _c.apply(void 0, [_e.sent()]).toBeDefined();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('places the comment after the paragraph the quote starts in', function () {
    var text = [
        'Intro line.',
        '',
        'We should **use a global cache** here',
        'because it is fast.',
        '',
        '```ts',
        'const cache = new Map()',
        '',
        'export default cache',
        '```',
        '',
        'Done.',
    ].join('\n');
    var one = { id: 1, comment: 'No globals', quote: 'We should use a global cache here' };
    var two = { id: 2, comment: 'Fine', quote: 'const cache = new Map()' };
    var out = (0, register_1.withAnnotations)(text, [one, two]).split('\n');
    (0, testing_1.expect)(out.indexOf('> 💬 **No globals**')).toBe(out.indexOf('because it is fast.') + 2);
    (0, testing_1.expect)(out.indexOf('> 💬 **Fine**')).toBe(out.indexOf('```', out.indexOf('```ts') + 1) + 2);
    (0, testing_1.expect)((0, register_1.withAnnotations)(text, [{ id: 3, comment: 'x', quote: 'not in there' }])).toBe(text);
});
