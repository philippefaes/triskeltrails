import json
import geopy.distance

with open("src/assets/tracks.json",'r') as jsonFile:
  data=json.load(jsonFile)

points = data['features'][0]['geometry']['coordinates']

p1 = (points[0][1], points[0][0])
p2 = (points[-1][1], points[-1][0])

#print(geopy.distance.geodesic(p1,p2).meters)

coords_1 = (52.2296756, 21.0122287)
coords_2 = (52.406374, 16.9251681)

print(geopy.distance.geodesic(p1, p2).km)

newPoints= []
firstPoint = points[0]
for point in points:
    if geopy.distance.geodesic((firstPoint[1], firstPoint[0]), (point[1], point[0])).meters >= 100:
        newPoints.append(point)
        firstPoint = point
print(f"Reduced from {len(points)} to {len(newPoints)} points")

newPoints[0:len(newPoints)/2]
newPoints[len(newPoints)/2:-1]

