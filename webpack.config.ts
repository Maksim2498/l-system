import type { Configuration as DevServerConfiguration } from "webpack-dev-server"
import type { Configuration                           } from "webpack"

import CssMinimizerPlugin   from "css-minimizer-webpack-plugin"
import HtmlPlugin           from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import TerserPlugin         from "terser-webpack-plugin"

import { resolve }          from "path"

export default (env: any) => {
    const production = env.production ?? false

    return {
        mode:    production ? "production" : "development",
        devtool: production ? false        : "source-map",

        entry:  "./src/ts/index.ts",
        output: {
            clean:    true,
            filename: `bundle${production ? ".[contenthash]" : ""}.js`,
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: `index${production ? ".[contenthash]" : ""}.css`,
            }),
            new HtmlPlugin({
                template: "./src/html/index.html"
            })
        ],

        module: {
            rules: [
                {
                    test:   /\.ts$/i,
                    loader: "ts-loader",
                    exclude: /node_modules/,
                },

                {
                    test: /\.css$/i,
                    use:  [MiniCssExtractPlugin.loader, "css-loader"],
                },
            ],
        },

        resolve: {
            extensions: [".ts", ".js", ".mjs", ".json"],
            alias:      {
                "css":  resolve(__dirname, "./src/css/"),
                "html": resolve(__dirname, "./src/html/"),
                "ts":   resolve(__dirname, "./src/ts/"),
            },
        },

        optimization: {
            minimizer: [
                new CssMinimizerPlugin(),
                new TerserPlugin(),
            ],
        },

        devServer: {
            port: 8000,
            hot:  "only",
        } as DevServerConfiguration
    } as Configuration
}