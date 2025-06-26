import csv
import io
from typing import List, Dict, Any
import plotly.graph_objects as go
import base64


def generate_csv(detailed_failures: List[Dict[str, Any]]) -> str:
    """Generate a CSV string from detailed failures."""
    if not detailed_failures:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=detailed_failures[0].keys())
    writer.writeheader()
    for row in detailed_failures:
        writer.writerow(row)
    return output.getvalue()


def generate_heatmap(detailed_failures: List[Dict[str, Any]]) -> str:
    """Generate a Plotly heatmap HTML from detailed failures."""
    if not detailed_failures:
        return "<div>No failures to plot.</div>"
    # Count failures by (waypoint_name, failure_type)
    counts = {}
    for fail in detailed_failures:
        wp = fail.get('waypoint_name', 'Unknown')
        ft = fail.get('failure_type', 'Unknown')
        counts[(wp, ft)] = counts.get((wp, ft), 0) + 1
    waypoints = sorted(set(wp for wp, _ in counts))
    failure_types = sorted(set(ft for _, ft in counts))
    z = [
        [counts.get((wp, ft), 0) for ft in failure_types]
        for wp in waypoints
    ]
    fig = go.Figure(data=go.Heatmap(z=z, x=failure_types, y=waypoints, colorscale='Reds'))
    fig.update_layout(title='Failure Heatmap', xaxis_title='Failure Type', yaxis_title='Waypoint')
    return fig.to_html(full_html=False) 