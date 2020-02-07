from typing import List

import pandas as pd


def load_data():
    return pd.read_csv("./data/pokemon_alopez247.csv")


from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder


numeric_features = ['Salary']
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())])

categorical_features = ['Age','Country']
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)])

def vectorize_examples(accepted_cols: List[str]):
    #convert_to_onehot =
    pass

if __name__ == "__main__":
    # Make sure we can load the data [DONE]
    # Hello dash
    # Dim reduction
    #   Map the pokemon to a vector
    #   Run dim reduction
    #   Show in dash
    #   Paramertized dim reduction
    #       Show the multi selection
    #       Redo dim reduction when changing the parameters
    # Show stats bar graph
    # Figure out how to link stats bargraph and scatter plot of dim reduction
    # Be able to show table of things in given filter
    # Sankey
    #   Draw the sankey
    #   Extra interaction??
    # (Optional) figure out picture in table
    print(load_data())
