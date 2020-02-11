import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output
from dash.exceptions import PreventUpdate
import plotly.express as px
import pandas as pd
import numpy as np
import json

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
df = pd.DataFrame(np.random.randn(50,5),columns=['a','b','c','d','e'])

## TODO: get data from dim reduction into a data frame. customdata will the the 'name' column of database. put bar_x = column names and bar_y = stat values
app.layout = html.Div([
    html.Div([
        html.H1("Exploring Pokémon Data")
    ],
    style={'text-align':'center'}),
    html.Div([
        dcc.Graph(
            id='pokemon-scatter',
            figure = {
                'data':[
                    {
                        'x':df['a'],
                        'y':df['b'],
                        'customdata':df['e'],
                        'mode':'markers',
                        'marker':{'size':12}
                    }
                ],
                'layout':{
                    'clickmode':'event+select'
                }
            }

        )
    ],style={'width': '49%', 'display': 'inline-block', 'padding': '0 20'}),
    html.Div([
        html.Div()
    ],style={'width': '49%', 'display': 'inline-block', 'padding': '0 20'},id='pokemon-stats'),
])


@app.callback(
    Output('pokemon-stats','children'),
    [Input('pokemon-scatter','clickData')])
def display_click_data(clickData):
    #using this to get index of the point
    if clickData is None:
        raise PreventUpdate
    name = clickData['points'][0]['customdata']
    ddf = df[df['e']==name]
    bar_x = ['c','d']
    bar_y = ddf['c'].append(ddf['e'])
    #temp = df.iloc[row].to_frame()
    fig = px.bar(x=bar_x,y=bar_y)
    return dcc.Graph(figure=fig)


if __name__ == '__main__':
    app.run_server(debug=True)
