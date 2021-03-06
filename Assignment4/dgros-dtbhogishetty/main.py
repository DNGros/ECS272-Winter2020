from typing import List
import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output
from dash.exceptions import PreventUpdate
import plotly.express as px
import pandas as pd
import numpy as np
import json
import plotly.graph_objects as go
from pandas import DataFrame
from data_constants import feats_all, feats_numeric, feats_ordinal, feat_colors, feats_bool, bool_colors
from dataproc import load_data, vectorize_examples, run_tsne
from util import setup_cache

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
df = load_data()

cache = setup_cache(app)

# IDs
id_dimreduct_feats = "dimreduct-feats"
###


def build_highlight_stat_dropdown():
    return dcc.Dropdown(
        id='highlight-stat-dropdown',
        options=[
            {"label": feat, "value": feat}
            for feat in feats_all
        ],
        value="Type_1"
    )


def build_dim_reduction_feats_selector():
    return dcc.Dropdown(
        id=id_dimreduct_feats,
        options=[
            {"label": feat, "value": feat}
            for feat in feats_all
        ],
        value=[feat for feat in feats_all],
        multi=True,
        clearable=False
    )


def build_sankey():
    sankey_df = df[['Type_1', 'Body_Style']]
    fig = px.parallel_categories(sankey_df)
    return fig


def build_layout():
    return html.Div([
        html.Div([
            html.H1("Exploring Pokémon Data")
        ], style={'text-align': 'center'}),
        html.Div([
            html.Label("Dimensionality Reduction Features:"),
            build_dim_reduction_feats_selector(),
            html.Plaintext(
                'Note, that updates to these inputs reruns the dimensionality'
                'reduction and can take significant time.'
            ),
            html.Label("Highlight Feature:"),
            build_highlight_stat_dropdown(),
        ]),
        html.Div([
            dcc.Loading(dcc.Graph(
                id='pokemon-scatter'
            ))
        ],style={'width': '60%', 'display': 'inline-block', 'padding': '0 20'}),
        html.Div([
            html.Div()
        ], id='pokemon-stats',style={'width': '40%', 'display': 'inline-block', 'padding': '0 20'}),
        html.Div([
            dcc.Graph(
                id='pokemon-sankey',
                figure=build_sankey()
            )
        ]),
    ])

app.layout = build_layout()

@cache.memoize()
def get_tsne_cached(dimreduct_feats: List[str]):
    print("Running tsne")
    vecs = vectorize_examples(df, dimreduct_feats)
    return run_tsne(vecs)


# Run the get_tsne on init so that it will show loading screen until this is ready
get_tsne_cached(feats_all)


@app.callback(
    Output('pokemon-scatter', 'figure'),
    [
        Input('highlight-stat-dropdown', 'value'),
        Input(id_dimreduct_feats, 'value')
    ])
def build_scatter(highlight_stat: str, dimreduct_feats: List[str]):
    tsne = get_tsne_cached(dimreduct_feats)

    def build_color(vals):
        if highlight_stat in feats_numeric + feats_ordinal:
            return vals
        elif highlight_stat in feats_bool:
            return [bool_colors[v] for v in vals]
        else:
            relevant_colors = feat_colors[highlight_stat]
            return [relevant_colors[str(v)] for v in vals]

    text = [
        f"{name} --- {highlight_val}"
        for name, highlight_val in zip(df['Name'], df[highlight_stat])
    ]

    fig = go.Figure(
        data=go.Scatter(
            x=tsne[:, 0],
            y=tsne[:, 1],
            mode='markers',
            text=text,
            hoverinfo='text',
            marker={
                "color": build_color(df[highlight_stat]),
                "colorscale": "PuBu"
            },
            customdata=df['Name']
        ),
        layout=go.Layout(

        )
    )
    return fig


@app.callback(
Output('pokemon-stats', 'children'),
[Input('pokemon-scatter', 'clickData')])
def display_click_data(clickData):
    #using this to get index of the point
    if clickData is None:
        raise PreventUpdate
    name = clickData['points'][0]['customdata']
    ddf = df[df['Name'] == name]
    bar_x = ['HP','Normal Attack','Normal Defense','Special Attack','Special Defence','Speed']
    bar_y = ddf['HP'].append(ddf['Attack']).append(ddf['Defense']).append(ddf['Sp_Atk']).append(ddf['Sp_Def']).append(ddf['Speed'])
    fig = px.bar(x=bar_x, y=bar_y,labels={'x': 'Pokemon Stats', 'y': 'Value'})
    return dcc.Graph(figure=fig)


if __name__ == '__main__':
    app.run_server(debug=True)
