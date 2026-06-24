# Carton Calculator

## Easiest way to run it

### Windows

1. Extract the ZIP file completely.
2. Open the extracted folder.
3. Double-click `run-windows.bat`.
4. Your browser will open at `http://127.0.0.1:8000`.
5. Keep the black server window open while using the app. Press `Ctrl+C` to stop it.

### macOS or Linux

Open Terminal in the app folder and run:

```bash
./run-mac-linux.sh
```

The app supports Python 3.11 and newer, including Python 3.13.

A frill-free hosted web app for calculating carton requirements by total item volume.

## Run Locally

Use Python 3.11 or newer.

On Windows, you can also double-click:

```text
run-windows.bat
```

`start_carton_calculator.bat` is also included and forwards to `run-windows.bat`.

```powershell
pip install -r requirements.txt
python server.py
```

Open:

```text
http://127.0.0.1:8000
```

## Default Users

All default users start with this password:

```text
ChangeMe123!
```

Users created:

- admin
- priyanka
- vandana
- kalpna
- poonam
- meghna
- sumit
- jisha
- larissa

The `admin` user has admin access. All other users are standard users.

## Box Categories

- Direct Outer: 90% usable volume
- Thermocol Box: 90% usable volume
- Temperature Thermocol Box: 70% usable volume
- Validated Cold Chain Box: 90% usable volume
- Max Cold Chain Boxes: 95% usable volume

## Carton Master Columns

- Code
- Category
- Length
- Breadth
- Height
- Volume
- Tare Weight

Dimensions and volume are in centimetres and cubic centimetres. Tare weight is treated as grams.

## Item Upload Columns

- Item Name
- Length
- Breadth
- Height
- Quantity
- Weight per Unit (g)

Item weight is optional. If any item weight is missing, gross weight is not calculated.

## Calculation Rule

The app filters cartons by the selected category, applies the category usable percentage, uses the largest carton first, and then chooses the smallest suitable carton for the leftover volume.

Volume weight is calculated as:

```text
Total selected carton volume / 6000
```

## Data

The app stores data in:

```text
data/app.db
```

For a fresh install, delete `data/app.db` and restart the app.
