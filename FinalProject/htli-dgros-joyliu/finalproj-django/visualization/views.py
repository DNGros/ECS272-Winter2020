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
    convert_examples_by_class_to_np, ColorManager

def __test__(request):
    return render(request, 'visualization.html')

def get_scatter_points(request):
    """
    # Return resampled scatter points in json to the frontend.
    Format: `{x: List[int], y: List[int], c: List[int], c_name: List[str], color: List[int], lvl: List[int]}`

    url: `get_scatter_points/`

    ~Currently a test without zoom-in feature~
    """

    # sample person activity dataset
    # ----------------------------------------------------------------
    # df = pd.read_csv('ConfLongDemo_JSI.csv')
    # filtered = df.loc[(df['Activity'] == 'walking') | (df['Activity'] == 'sitting') | (df['Activity'] == 'standing up from lying')]
    # print("Number of instances: {0}".format(len(filtered)))

    # class_mapping = {'walking': 0, 'sitting': 1, 'standing up from lying': 2}

    # points = np.vstack([filtered.X, filtered.Y]).T
    # classes = np.array([class_mapping[a] for a in filtered.Activity])

    # scat_points = convert_np_to_points(points, classes)
    # st_time = time.time()
    # samples = sample_data(scat_points, 1, 1, point_radius=.2)
    # end_time = time.time()
    # print("Took {0: .2f} minutes to resample the points".format(end_time - st_time))
    # ----------------------------------------------------------------


    # partially sample person activity dataset for testing
    # ----------------------------------------------------------------
    df = pd.read_csv('ConfLongDemo_JSI.csv')
    filtered = df.loc[(df['Activity'] == 'walking') | (df['Activity'] == 'sitting') | (df['Activity'] == 'standing up from lying')]
    print("Number of instances: {0}".format(len(filtered)))

    class_mapping = {'walking': 0, 'sitting': 1, 'standing up from lying': 2}
    index_mapping = {0: 'walking', 1: 'sitting', 2: 'standing up from lying'}

    testset = pd.concat([
        filtered[filtered['Activity'] == 'walking'].head(1000),
        filtered[filtered['Activity'] == 'sitting'].head(1000),
        filtered[filtered['Activity'] == 'standing up from lying'].head(1000)
    ])

    points = np.vstack([testset.X, testset.Y]).T
    classes = np.array([class_mapping[a] for a in testset.Activity])

    scat_points = convert_np_to_points(points, classes)
    st_time = time.time()
    samples = sample_data(scat_points, 1, 1, point_radius=.2)
    end_time = time.time()
    print("Took {0: .2f} minutes to resample the points".format(end_time - st_time))
    # ----------------------------------------------------------------


    # sample generated test data
    # ----------------------------------------------------------------
    # points, classes = make_classification(
    #     n_features=2,
    #     n_redundant=0,
    #     n_informative=2,
    #     n_classes=2,
    #     n_samples=300,
    #     n_clusters_per_class=1,
    #     hypercube=False
    # )
    # scat_points = convert_np_to_points(points, classes)
    # samples = sample_data(scat_points, 1, 3, point_radius=.2)
    # ----------------------------------------------------------------

    cm = ColorManager(scat_points)
    colors = cm.get_colors()
    print("colors: {}".format(colors))

    x = []
    y = []
    c = []
    c_name = []
    clr = []
    lvl = []
    for level_data in samples:
        cur_lvl, pts = level_data
        for cl in pts:
            for pt in cl:
                pos = pt.coord
                x.append(pos[0])
                y.append(pos[1])
                c.append(int(pt.class_id))
                c_name.append(index_mapping[int(pt.class_id)])
                clr.append(colors[int(pt.class_id)])
                lvl.append(cur_lvl)
    
    orig_x = list(testset.X)
    orig_y = list(testset.Y)
    orig_c = [class_mapping[i] for i in testset.Activity]
    orig_c_name = list(testset.Activity)
    orig_clr = [colors[i] for i in orig_c]
    # print("x:{0}, y:{1}, c{2}, lvl:{3}".format(len(x), len(y), len(c), len(lvl)))
    data = {
        'x': x,
        'y': y,
        'c': c,
        'c_name': c_name,
        'clr': clr,
        'lvl': lvl,
        'orig_x': orig_x,
        'orig_y': orig_y,
        'orig_c': orig_c,
        'orig_c_name': orig_c_name,
        'orig_clr': orig_clr
    }
    return JsonResponse(data)


def get_orig_scatter_points(request):
    """
    # Return original scatter points in json to the frontend.
    Format: `{x: List[int], y: List[int], c: List[int], color: List[int], lvl: List[int]}`

    url: `get_orig_scatter_points/`

    ~Currently a test without zoom-in feature~
    """

    df = pd.read_csv('ConfLongDemo_JSI.csv')
    filtered = df.loc[(df['Activity'] == 'walking') | (df['Activity'] == 'sitting') | (df['Activity'] == 'standing up from lying')]
    print("Number of instances: {0}".format(len(filtered)))

    class_mapping = {'walking': 0, 'sitting': 1, 'standing up from lying': 2}

    points = np.vstack([filtered.X, filtered.Y]).T
    classes = np.array([class_mapping[a] for a in filtered.Activity])
    # to get the colors we do need KDE, so it's still necessary to convert them to points
    scat_points = convert_np_to_points(points, classes)

    cm = ColorManager(scat_points)
    colors = cm.get_colors()

    x = list(filtered.X)
    y = list(filtered.Y)
    c = [class_mapping[cl] for cl in filtered.Activity]
    clr = [colors[i] for i in c]
    lvl = [1 for i in x]

    data = {'x': x, 'y': y, 'c': c, 'clr': clr, 'lvl': lvl}
    return JsonResponse(data)