import math

class Physics():

    global G = 6.673 * 10**-11 # Newton's gravitation constant

    def orbital_speed(central_body, radius):
        v = math.sqrt((G*central_body.mass)/radius)
        return v

    def acceleration(central_body, radius):
        a = (G*central_body.mass)/(radius**2)

    def orbital_period(central_body, radius):
        T = (4*math.pi**2)*(radius**3)/(G*central_body.mass)
