import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.datasets import make_blobs
from sklearn.datasets import make_gaussian_quantiles

from src.dataproc import convert_points_to_np, convert_np_to_points, sample_data, \
    convert_examples_by_class_to_np

if __name__ == "__main__":
    point_radius = 25
    points, classes = make_classification(
        n_features=2, n_redundant=0, n_informative=2, n_clusters_per_class=1, n_samples=100)
    print(classes)
    plt.scatter(points[:, 0], points[:, 1], marker='o', c=classes, s=point_radius, edgecolor='k')
    plt.show()
    scat_points = convert_np_to_points(points, classes)
    samples = sample_data(scat_points, 1, 1, point_radius=0.5)
    for zoom_level, zoom_points_by_class in samples:
        points_sampled, classes_sampled = convert_examples_by_class_to_np(zoom_points_by_class)
        plt.scatter(points_sampled[:, 0], points_sampled[:, 1],
                    marker='o', c=classes_sampled, s=point_radius, edgecolor='k')
        plt.show()

