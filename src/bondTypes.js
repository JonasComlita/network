const BondTypes = {
    HYDROGEN: {
      type: "Hydrogen bond",
      description: "Electrostatic attraction between hydrogen and electronegative atoms (N, O, F, Cl)",
      color: "#00FFFF",
      strength: "Moderate (5-30 kJ/mol)",
      additional: "Crucial in water, DNA, and protein structures"
    },
    METALLIC: {
      type: "Metallic bond",
      description: "Sharing of delocalized electrons among a lattice of metal atoms",
      color: "#FFD700",
      strength: "Strong (100-1000 kJ/mol)",
      additional: "Responsible for electrical conductivity, malleability, and ductility"
    },
    COVALENT_PURE: {
      type: "Pure covalent bond",
      description: "Equal sharing of electron pairs between atoms",
      color: "#00FF00",
      strength: "Strong (150-1000 kJ/mol)",
      additional: "Common in diatomic molecules (H₂, O₂, N₂)"
    },
    COVALENT_POLAR: {
      type: "Polar covalent bond",
      description: "Unequal sharing of electron pairs, creating partial charges",
      color: "#FFA500",
      strength: "Strong (150-800 kJ/mol)",
      additional: "Found in H₂O, NH₃, HCl"
    },
    IONIC: {
      type: "Ionic bond",
      description: "Complete transfer of electrons creating charged ions",
      color: "#FF0000",
      strength: "Strong (400-4000 kJ/mol)",
      additional: "Common in salts (NaCl, MgO)"
    },
    VAN_DER_WAALS: {
      type: "Van der Waals forces",
      description: "Weak attractions between temporary dipoles in nonpolar molecules",
      color: "#FF00FF",
      strength: "Weak (0.1-40 kJ/mol)",
      additional: "Important in noble gases and nonpolar molecules"
    },
    COORDINATE_COVALENT: {
      type: "Coordinate covalent bond",
      description: "Covalent bond where both electrons come from one atom",
      color: "#9932CC",
      strength: "Strong (200-600 kJ/mol)",
      additional: "Found in complex ions and Lewis acid-base adducts"
    },
    THREE_CENTER_TWO_ELECTRON: {
      type: "Three-center two-electron bond",
      description: "Three atoms sharing two electrons across a bridge",
      color: "#00CED1",
      strength: "Moderate (100-300 kJ/mol)",
      additional: "Common in boron compounds like diborane"
    },
    PI_BOND: {
      type: "Pi (π) bond",
      description: "Sideways overlap of p-orbitals forming a secondary bond",
      color: "#4169E1",
      strength: "Moderate (200-400 kJ/mol)",
      additional: "Found in double and triple bonds alongside sigma bonds"
    }
  };