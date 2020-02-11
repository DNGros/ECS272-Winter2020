feats_textual = ['Name']
# TODO figure out more complex mapping for types with domain knowledge of strengths
feats_categorical = ['Type_1', 'Type_2', 'Color', 'Egg_Group_2', 'Body_Style']
feats_numeric = ['Total', 'HP', 'Attack', 'Defense', 'Sp_Atk', 'Sp_Def',
                 'Speed', 'Pr_Male', 'Height_m', 'Weight_kg', 'Catch_Rate']
feats_ordinal = ['Generation']
feats_bool = ['isLegendary', 'hasGender', 'hasMegaEvolution']

feats_all = feats_textual + feats_categorical + feats_ordinal + feats_bool + feats_numeric
