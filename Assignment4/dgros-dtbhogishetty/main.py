import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output
import plotly.express as px
import pandas as pd
import numpy as np
import json

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
df = pd.DataFrame(np.random.randn(50,5),columns=['a','b','c','d','e'])

app.layout = html.Div([
    html.Div([
        html.H1("Exploring Pokémon Data")
    ],
    style={'text-align':'center'}),
    html.Div([
        dcc.Graph(
            id='pokemon-scatter',
            figure = px.scatter(df,x='a',y='b')
        )
    ]),
    html.Div(id='click-data'),
    html.Div([
        dcc.Graph(
            id='pokemon-stats'
        )
    ])
])

@app.callback(
    Output('click-data','children'),
    [Input('pokemon-scatter','clickData')])
def display_click_data(clickData):
    #using this to get index of the point
    row = clickData['points'][0]['pointIndex']
    #temp = df.iloc[row].to_frame()
    #fig = px.bar(temp)
    return

if __name__ == '__main__':
    app.run_server(debug=True)
