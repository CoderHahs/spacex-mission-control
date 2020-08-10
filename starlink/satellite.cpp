#include <iostream>
using namespace std;

class Satellite
{
public:
    float orbitalSpeed;
    float acceleration;
    float orbitalPeriod;
    Satellite(float os, float a, float op)
    {
        orbitalSpeed = os;
        acceleration = a;
        orbitalPeriod = op;
    }
};