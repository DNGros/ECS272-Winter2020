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

from dataproc import load_data, vectorize_examples, run_tsne

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
df = load_data()

def build_scatter():
    vecs = vectorize_examples(df)
    tsne = run_tsne(vecs)
    return dcc.Graph(
        id='pokemon-scatter',
        figure={
            'data': [
                {
                    'x': tsne[:, 0],
                    'y': tsne[:, 1],
                    'customdata': df['Name'],
                    'mode': 'markers',
                    'type': 'scatter',
                    #'marker': {'size': 12},
                    'text': df['Name'],
                    'hoverinfo': 'text'
                }
            ],
            'layout': {
                'clickmode': 'event+select'
            }
        }
    )
    return dcc.Graph(
        id='pokemon-scatter',
        figure=fig
    )


def build_layout():
    ## TODO: put bar_x = column names and bar_y = stat values
    return html.Div([
        html.Div([
            html.H1("Exploring Pokémon Data")
        ],
        style={'text-align':'center'}),
        html.Div([
            build_scatter()
        ],style={'width': '49%', 'display': 'inline-block', 'padding': '0 20'}),
        html.Div([
            html.Div()
        ],style={'width': '49%', 'display': 'inline-block', 'padding': '0 20'},id='pokemon-stats'),
    ])

app.layout = build_layout()


@app.callback(
    Output('pokemon-stats', 'children'),
    [Input('pokemon-scatter', 'clickData')])
def display_click_data(clickData):
    #using this to get index of the point
    if clickData is None:
        raise PreventUpdate
    name = clickData['points'][0]['customdata']
    ddf = df[df['Name'] == name]
    bar_x = ['Health Points','Attack','Defense','Special Attack','Special Defence','Speed']
    bar_y = ddf['HP'].append(ddf['Attack']).append(ddf['Defense']).append(ddf['Sp_Atk']).append(ddf['Sp_Def']).append(ddf['Speed'])
    fig = px.bar(x=bar_x, y=bar_y)
    return dcc.Graph(figure=fig)


if __name__ == '__main__':
    app.run_server(debug=True)
