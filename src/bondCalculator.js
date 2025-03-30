class BondCalculator {
  static METALS = [3, 4, 11, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
                   37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 55, 56, 57,
                   74, 76, 77, 78, 79, 80, 81, 82, 83, 88, 89, 90, 91, 92];
  static HYDROGEN_BONDING_ELEMENTS = [7, 8, 9, 17];
  static ELECTRONEGATIVE_ELEMENTS = [7, 8, 9, 17];
  static BORON_GROUP = [5, 13, 31, 49, 81];
  static CARBON_GROUP = [6, 14, 32, 50, 82];

  static determineBondType(element1, element2, diffEN = 0) {
    if (this.isHydrogenBonding(element1, element2)) {
      return BondTypes.HYDROGEN;
    }
    if (this.isMetallic(element1, element2)) {
      return BondTypes.METALLIC;
    }
    if (this.isThreeCenterBond(element1, element2)) {
      return BondTypes.THREE_CENTER_TWO_ELECTRON;
    }
    if (this.isCoordinateCovalent(element1, element2)) {
      return BondTypes.COORDINATE_COVALENT;
    }
    if (this.isVanDerWaals(element1, element2)) {
      return BondTypes.VAN_DER_WAALS;
    }

    if (diffEN < 0.4) {
      const bond = { ...BondTypes.COVALENT_PURE };
      if (this.hasPiBonding(element1, element2)) {
        bond.additional += " + possible " + BondTypes.PI_BOND.type;
        bond.description += " (may include pi bonds)";
      }
      return bond;
    } else if (diffEN >= 0.4 && diffEN < 1.7) {
      const bond = { ...BondTypes.COVALENT_POLAR };
      if (this.hasPiBonding(element1, element2)) {
        bond.additional += " + possible " + BondTypes.PI_BOND.type;
      }
      return bond;
    } else {
      return BondTypes.IONIC;
    }
  }

  static isHydrogenBonding(element1, element2) {
    return (element1 === 1 && this.ELECTRONEGATIVE_ELEMENTS.includes(element2)) ||
           (element2 === 1 && this.ELECTRONEGATIVE_ELEMENTS.includes(element1));
  }

  static isMetallic(element1, element2) {
    return this.METALS.includes(element1) && this.METALS.includes(element2);
  }

  static isThreeCenterBond(element1, element2) {
    return (this.BORON_GROUP.includes(element1) && element2 === 1) ||
           (this.BORON_GROUP.includes(element2) && element1 === 1);
  }

  static isCoordinateCovalent(element1, element2) {
    const lewisBases = [7, 8];
    const lewisAcids = [5, 13];
    return (lewisBases.includes(element1) && lewisAcids.includes(element2)) ||
           (lewisBases.includes(element2) && lewisAcids.includes(element1));
  }

  static isVanDerWaals(element1, element2) {
    const nobleGases = [2, 10, 18, 36, 54, 86];
    return (nobleGases.includes(element1) || nobleGases.includes(element2)) ||
           (element1 === element2 && !this.ELECTRONEGATIVE_ELEMENTS.includes(element1));
  }

  static hasPiBonding(element1, element2) {
    return this.CARBON_GROUP.includes(element1) || 
           this.CARBON_GROUP.includes(element2) ||
           [7, 8, 15, 16].includes(element1) || 
           [7, 8, 15, 16].includes(element2);
  }
}