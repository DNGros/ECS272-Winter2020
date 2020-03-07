from django.shortcuts import render
from django.http import HttpResponse, JsonResponse

import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.datasets import make_blobs
from sklearn.datasets import make_gaussian_quantiles
import pandas as pd
import numpy as np
import time
#import seaborn as sns

from visualization.src.dataproc import convert_points_to_np, convert_np_to_points, sample_data, \
    convert_examples_by_class_to_np

def __test__(request):
    return render(request, 'visualization.html')

def get_scatter_points(request):
    """
    # Return scatter points in json to the frontend.
    Format: `{x: List[int], y: List[int], c: List[int], lvl: List[int]}`

    url: `get_scatter_points/`

    ~Currently a test without zoom-in feature~
    """

    df = pd.read_csv('ConfLongDemo_JSI.csv')
    filtered = df.loc[(df['Activity'] == 'walking') | (df['Activity'] == 'sitting') | (df['Activity'] == 'standing up from lying')]
    print("Number of instances: {0}".format(len(filtered)))

    class_mapping = {'walking': 0, 'sitting': 1, 'standing up from lying': 2}

    points = np.vstack([filtered.X, filtered.Y]).T
    classes = np.array([class_mapping[a] for a in filtered.Activity])

    scat_points = convert_np_to_points(points, classes)
    st_time = time.time()
    samples = sample_data(scat_points, 1, 1, point_radius=.2)
    end_time = time.time()
    print("Took {0: .2f} minutes to resample the points".format(end_time - st_time))

    x = []
    y = []
    c = []
    lvl = []
    for level_data in samples:
        cur_lvl, pts = level_data
        for cl in pts:
            for pt in cl:
                pos = pt.coord
                x.append(pos[0])
                y.append(pos[1])
                c.append(int(pt.class_id))
                lvl.append(cur_lvl)
    print("x:{0}, y:{1}, c{2}, lvl:{3}".format(len(x), len(y), len(c), len(lvl)))
    data = {'x': x, 'y': y, 'c': c, 'lvl': lvl}
    return JsonResponse(data)