"use strict";
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
var config_1 = require("vitest/config");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
var vite_plugin_runtime_error_modal_1 = require("@replit/vite-plugin-runtime-error-modal");
var vite_plugin_1 = require("@codecov/vite-plugin");
exports.default = (0, config_1.defineConfig)({
    plugins: __spreadArray(__spreadArray([
        (0, plugin_react_1.default)(),
        (0, vite_plugin_runtime_error_modal_1.default)()
    ], (process.env.NODE_ENV !== "production" &&
        process.env.REPL_ID !== undefined
        ? [
            await Promise.resolve().then(function () { return require("@replit/vite-plugin-cartographer"); }).then(function (m) {
                return m.cartographer();
            }),
        ]
        : []), true), [
        (0, vite_plugin_1.codecovVitePlugin)({
            enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
            bundleName: "lecce-digital-community-legends",
            uploadToken: process.env.CODECOV_TOKEN,
        }),
    ], false),
    resolve: {
        alias: {
            "@": path_1.default.resolve(import.meta.dirname, "client", "src"),
            "@shared": path_1.default.resolve(import.meta.dirname, "shared"),
            "@assets": path_1.default.resolve(import.meta.dirname, "public/assets"),
        },
    },
    root: path_1.default.resolve(import.meta.dirname, "client"),
    build: {
        outDir: path_1.default.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    tesseract: ['tesseract.js'],
                },
            },
        },
    },
    publicDir: path_1.default.resolve(import.meta.dirname, "public"),
    worker: {
        format: 'es',
        rollupOptions: {
            output: {
                format: 'es',
            },
        },
    },
    server: {
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
    // Configurazione Vitest
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                'dist/',
                'public/',
            ],
        },
    },
});
