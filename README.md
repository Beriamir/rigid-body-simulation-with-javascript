# Rigid Body Physics Engine in JavaScript

This project is a **fun, experimental implementation of rigid body physics** written in JavaScript. 
The goal was to explore realistic collision detection and resolution for rectangles, with rotation and friction effects included. 
While not perfect, the project achieves **unconditional stability** in handling collisions.

## What It Does Well

- **Collision Handling**: Detects and resolves collisions accurately without instability.
- **Rotation and Friction**: Adds realism by simulating angular movement and energy loss.
- **Simple and Stable**: Prioritizes unconditional stability, making it robust in dynamic environments.

## What It Struggles With

- **Wobbling When Stacking**: Rectangles stacked on top of each other exhibit slight wobbling, especially with large stacks.
- **Limited Shapes**: Only supports rectangles (no circles or custom polygons yet).

## Why I Built This

The main goal was to create a physics simulation where rectangles interact realistically under rotation and friction.

## What's Next

- Improve the handling of stacked rectangles to minimize wobbling.
- Add support for other shapes like circles and convex polygons.
- Experiment with performance optimizations for larger simulations.

## Contributing

Got an idea to fix the wobbling? Want to add a new shape? Contributions and feedback are welcome!

## License

This project is licensed under the MIT License.
