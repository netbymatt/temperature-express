// scaled number
// easily works with numbers that can be scaled in different units
// provides conversion function and naming of each unit
// units are defined as original = m*scaled + b in an array of objects {unit, m, b}
// val is always in the selected units
// originalVal is always returned in the scale of units[0]

class ScaledNumber {
	constructor(newVal, newMin, newMax, newUnits, scrollAmount) {
		// private values
		this.defaultUnit = { unit: '', m: 1, b: 0 };

		// values with defaults
		this.val = null;
		this.min = -1e6;
		this.max = 1e6;
		this.scrollAmount = (this.max - this.min) / 100;
		this._units = [this.defaultUnit];
		this._currentUnitIndex = 0;
		this.currentUnitName = '';

		// build the units array
		// unit must be specified, m and b are optional and default to 1 and 0 respectively
		const units = [];
		if (Array.isArray(newUnits)) {
			newUnits.forEach((_element, index) => {
				// test for valid unit
				const element = { ..._element };
				if (element.hasOwnProperty('unit')) {
					// set defaults for m and b if necessary
					element.m = (typeof element.m === 'number') ? element.m : 1;
					element.b = (typeof element.b === 'number') ? element.b : 0;
					// set precision or default
					element.precision = (typeof element.precision === 'number') ? Math.round(element.precision) : 0;
					// store an index, used by some functions
					element.index = index;
					units.push(element);
				} // unit is present
			}); // map
		} // newUnits array is provided

		// copy units if some were found, otherwise left as default
		if (units !== undefined) {
			this._units = units;
		} // units found

		// set initial unit name
		this.currentUnitName = this._units[0].unit;
		this.currentPrecision = this._units[0].precision;

		// call set to create default value
		this.set(newVal, 0, newMin, newMax, scrollAmount);

		return this;
	}	// constructor

	// sets value in current unitId
	// if a unitId is provided the provided newVal is converted into the current units and then checked against the limits
	set(_newVal, _unitId, newMin, newMax, scrollAmount) {
		let newVal = _newVal;
		// default to current units
		const unitId = _unitId ?? this._currentUnitIndex;
		// perform conversion if necessary
		if (unitId !== this._currentUnitIndex) {
			newVal = this._convertUnit(_newVal, unitId, this._currentUnitIndex);
		}
		// update values if provided
		this.min = (newMin !== undefined) ? parseFloat(newMin) : this.min;
		this.max = (newMax !== undefined) ? parseFloat(newMax) : this.max;
		this.val = (newVal !== undefined) ? (newVal === null ? null : parseFloat(newVal)) : this.val;
		// coerce to limits
		if (this.val !== null) {
			if (this.val > this.max) { this.val = this.max; }
			if (this.val < this.min) { this.val = this.min; }
		}

		// scroll amount if provided, otherwise 100 steps across range
		if (scrollAmount) {
			this.scrollAmount = scrollAmount;
		} else {
			this.scrollAmount = Math.ceil((this.max - this.min) / 100);
		}

		// return value
		return this;
	}

	// provide value primitive
	valueOf() {
		return this.val;
	}

	// provide value as string to specified precision
	atPrecision() {
		if (this.val === null) return null;
		return this.val.toFixed(this.currentPrecision);
	}

	// get the unit for a provided index or name
	getUnit(unitId) {
		if (typeof unitId === 'number') {
			if (this._units[unitId] !== undefined) {
				return this._units[unitId];
			} // not undefined
		} // number

		// search for unitId
		const find = this._units.find((element) => unitId === element.unit);

		// return the find value if not undefined
		if (find !== undefined) {
			return find;
		}

		// if we made it here there were problems above, return default unit
		return this.defaultUnit;
	}

	// list all units
	// returns an array of unit names
	getUnits() {
		return this._units.map((val) => val.unit);
	}

	// convert unit
	// internal function to convert from one unit to another
	// source and dest can be _units array index or string _units.unit
	_convertUnit(val, source, dest) {
		if (val === null) return null;
		// get the two units
		const s = this.getUnit(source);
		const d = this.getUnit(dest);

		// perform calculation
		return (s.m * val + s.b - d.b) / d.m;
	}

	// set unit
	// converts val, min and max to selected unit from currentUnitName
	setUnit(dest) {
		// convert val, min and max
		if (this.val !== null) {
			this.val = this._convertUnit(this.val, this._currentUnitIndex, dest);
		}
		this.min = this._convertUnit(this.min, this._currentUnitIndex, dest);
		this.max = this._convertUnit(this.max, this._currentUnitIndex, dest);

		// set properties for new unit
		const currentUnit = this.getUnit(dest);
		this._currentUnitIndex = currentUnit.index;
		this.currentUnitName = currentUnit.unit;
		this.currentPrecision = currentUnit.precision;
		return this;
	}

	// get base val
	// convenience function to return the value in _units[0]
	getBaseVal(unitId) {
		return this._convertUnit(this.val, this._currentUnitIndex, unitId);
	}
}

export default ScaledNumber;
