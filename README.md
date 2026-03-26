# bedrock-redstone_interactive

An online free interactive simulator for building and learning Minecraft Bedrock edition redstone mechanics and circuits. Inspired by https://redstone.build with a 3D-ish block look and component palette.

## Features

- 15x15 (configurable) tile-based redstone grid (isometric 3D/stylized block view)
- Place components: redstone dust, levers, buttons, redstone torches, repeaters, lamps, solid blocks, pistons, sticky pistons, observers
- Toggle levers and buttons (with 4-tick button pulse) and update power flow instantly
- Simulated Bedrock-inspired mechanics: dust decay, directional repeaters, torch inversion, piston push/retraction, observer pulse output
- Rotate repeaters/pistons/observers with `Shift+click`
- Right-click to remove components
- Layer selector for true Y stacking (layer 0..3). Place blocks and redstone on each layer.
- Drag placement (mouse down + move), copy/paste blueprint (buttons), and shared clipboard export.
- Load built-in example circuits (AND, OR, RS latch, piston push, sticky piston, observer pulse, layer stack)

## Files

- `index.html` - main UI
- `styles.css` - layout + styling
- `app.js` - redstone simulation logic

## Run locally

1. Open the folder in VS Code.
2. Use Live Server extension or run a local static server:

```bash
# from repository root
python3 -m http.server 8000
```

3. Open `http://localhost:8000` in your browser.
4. Use the palette to select a component and click cells to place them.

## Keyboard & mouse

- Left click: place selected component
- Right click: remove component
- Shift + left click: rotate repeaters/pistons/comparator/observer; change comparator mode on comparator (compare/subtract)
- Click lever to toggle on/off
- Drag and draw by holding mouse and moving over cells
- Use layer selector to choose which Y layer to edit/view
- Copy blueprint and Paste blueprint buttons save/load the circuit state


## Notes

This is a learning simulator. It uses a simplified physics model for quick exploration, rooted in Bedrock redstone behavior.

