import numpy as np
from sklearn.linear_model import LinearRegression


x = np.array([5, 10, 15, 20, 30, 50, 100, 200]).reshape((-1, 1))
y = np.array([12.8, 21, 29.6, 35.3, 53, 85, 169, 338])

model = LinearRegression()

model.fit(x, y)

y_ = model.predict(x)

print(y_)

y70_90 = model.predict([[70], [90]])


print( y70_90)