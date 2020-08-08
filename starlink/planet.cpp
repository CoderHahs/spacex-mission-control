#include <iostream>
using namespace std;

class Planet
{
public:
    string name;
    float mu;
    float mean_radius;
    float equatorial_radius;
    float polar_radius;
    float j2;
    float jpl_id;
    Planet(string name, float mu, float mean_radius, float equatorial_radius, float polar_radius, float j2, float jpl_id)
    {
        name = name;
        mu = mu;
        mean_radius = mean_radius;
        equatorial_radius = equatorial_radius;
        polar_radius = polar_radius;
        j2 = j2;
        jpl_id = jpl_id;
    }
};