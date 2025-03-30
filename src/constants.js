const elementMap = {
    1: {
      number: 1,
      symbol: "H",
      name: "Hydrogen",
      group: 1,
      period: 1,
      category: "diatomic nonmetal",
      electronegativity: 2.20,
      structure: "1 proton, 0 neutrons, 1 electron",
      interactions: {
        1: "Forms H₂ (hydrogen gas)",
        6: "Forms hydrocarbons (e.g., CH₄)",
        7: "Forms ammonia (NH₃)",
        8: "Forms water (H₂O)",
        9: "Forms hydrogen fluoride (HF)",
        16: "Forms hydrogen sulfide (H₂S)",
        17: "Forms hydrogen chloride (HCl)"
      },
      description: "Lightest element, highly reactive, exists as H₂ in nature"
    },
    2: {
      number: 2,
      symbol: "He",
      name: "Helium",
      group: 18,
      period: 1,
      category: "noble gas",
      electronegativity: null,
      structure: "2 protons, 2 neutrons, 2 electrons",
      interactions: {
        1: "No stable compounds",
        8: "No stable compounds"
      },
      description: "Second most abundant element, inert, used in balloons"
    },
    3: {
      number: 3,
      symbol: "Li",
      name: "Lithium",
      group: 1,
      period: 2,
      category: "alkali metal",
      electronegativity: 0.98,
      structure: "3 protons, 4 neutrons, 3 electrons",
      interactions: {
        8: "Forms lithium oxide (Li₂O)",
        9: "Forms lithium fluoride (LiF)",
        17: "Forms lithium chloride (LiCl)",
        35: "Forms lithium bromide (LiBr)"
      },
      description: "Lightest metal, highly reactive, used in batteries"
    },
    4: {
      number: 4,
      symbol: "Be",
      name: "Beryllium",
      group: 2,
      period: 2,
      category: "alkaline earth metal",
      electronegativity: 1.57,
      structure: "4 protons, 5 neutrons, 4 electrons",
      interactions: {
        8: "Forms beryllium oxide (BeO)",
        9: "Forms beryllium fluoride (BeF₂)",
        17: "Forms beryllium chloride (BeCl₂)"
      },
      description: "Light, strong metal, toxic, used in aerospace"
    },
    5: {
      number: 5,
      symbol: "B",
      name: "Boron",
      group: 13,
      period: 2,
      category: "metalloid",
      electronegativity: 2.04,
      structure: "5 protons, 6 neutrons, 5 electrons",
      interactions: {
        1: "Forms boranes (e.g., B₂H₆)",
        8: "Forms boric acid (H₃BO₃)",
        9: "Forms boron trifluoride (BF₃)"
      },
      description: "Metalloid, used in glass, has unique bonding"
    },
    6: {
      number: 6,
      symbol: "C",
      name: "Carbon",
      group: 14,
      period: 2,
      category: "polyatomic nonmetal",
      electronegativity: 2.55,
      structure: "6 protons, 6 neutrons, 6 electrons",
      interactions: {
        1: "Forms methane (CH₄)",
        6: "Forms diamond/graphite",
        8: "Forms carbon dioxide (CO₂)",
        16: "Forms carbon disulfide (CS₂)"
      },
      description: "Basis of organic chemistry, forms multiple bonds"
    },
    7: {
      number: 7,
      symbol: "N",
      name: "Nitrogen",
      group: 15,
      period: 2,
      category: "diatomic nonmetal",
      electronegativity: 3.04,
      structure: "7 protons, 7 neutrons, 7 electrons",
      interactions: {
        1: "Forms ammonia (NH₃)",
        6: "Forms cyanide (CN⁻)",
        8: "Forms nitric oxide (NO)",
        15: "Forms dinitrogen (N₂)"
      },
      description: "Major component of air, triple bond in N₂"
    },
    8: {
      number: 8,
      symbol: "O",
      name: "Oxygen",
      group: 16,
      period: 2,
      category: "diatomic nonmetal",
      electronegativity: 3.44,
      structure: "8 protons, 8 neutrons, 8 electrons",
      interactions: {
        1: "Forms water (H₂O)",
        6: "Forms carbon dioxide (CO₂)",
        8: "Forms ozone (O₃)",
        11: "Forms sodium oxide (Na₂O)"
      },
      description: "Essential for respiration, exists as O₂"
    },
    9: {
      number: 9,
      symbol: "F",
      name: "Fluorine",
      group: 17,
      period: 2,
      category: "halogen",
      electronegativity: 3.98,
      structure: "9 protons, 10 neutrons, 9 electrons",
      interactions: {
        1: "Forms hydrogen fluoride (HF)",
        3: "Forms lithium fluoride (LiF)",
        11: "Forms sodium fluoride (NaF)",
        20: "Forms calcium fluoride (CaF₂)"
      },
      description: "Most electronegative element, highly reactive"
    },
    10: {
      number: 10,
      symbol: "Ne",
      name: "Neon",
      group: 18,
      period: 2,
      category: "noble gas",
      electronegativity: null,
      structure: "10 protons, 10 neutrons, 10 electrons",
      interactions: {
        1: "No stable compounds",
        9: "No stable compounds"
      },
      description: "Inert gas, used in lighting"
    },
    11: {
      number: 11,
      symbol: "Na",
      name: "Sodium",
      group: 1,
      period: 3,
      category: "alkali metal",
      electronegativity: 0.93,
      structure: "11 protons, 12 neutrons, 11 electrons",
      interactions: {
        8: "Forms sodium oxide (Na₂O)",
        9: "Forms sodium fluoride (NaF)",
        17: "Forms sodium chloride (NaCl)",
        35: "Forms sodium bromide (NaBr)"
      },
      description: "Highly reactive, soft metal, common in salts"
    },
    12: {
      number: 12,
      symbol: "Mg",
      name: "Magnesium",
      group: 2,
      period: 3,
      category: "alkaline earth metal",
      electronegativity: 1.31,
      structure: "12 protons, 12 neutrons, 12 electrons",
      interactions: {
        8: "Forms magnesium oxide (MgO)",
        9: "Forms magnesium fluoride (MgF₂)",
        17: "Forms magnesium chloride (MgCl₂)"
      },
      description: "Light structural metal, burns brightly"
    },
    13: {
      number: 13,
      symbol: "Al",
      name: "Aluminum",
      group: 13,
      period: 3,
      category: "post-transition metal",
      electronegativity: 1.61,
      structure: "13 protons, 14 neutrons, 13 electrons",
      interactions: {
        8: "Forms aluminum oxide (Al₂O₃)",
        9: "Forms aluminum fluoride (AlF₃)",
        17: "Forms aluminum chloride (AlCl₃)"
      },
      description: "Light, durable metal, widely used"
    },
    14: {
      number: 14,
      symbol: "Si",
      name: "Silicon",
      group: 14,
      period: 3,
      category: "metalloid",
      electronegativity: 1.90,
      structure: "14 protons, 14 neutrons, 14 electrons",
      interactions: {
        1: "Forms silane (SiH₄)",
        8: "Forms silicon dioxide (SiO₂)",
        9: "Forms silicon tetrafluoride (SiF₄)"
      },
      description: "Basis of semiconductors, abundant in crust"
    },
    15: {
      number: 15,
      symbol: "P",
      name: "Phosphorus",
      group: 15,
      period: 3,
      category: "polyatomic nonmetal",
      electronegativity: 2.19,
      structure: "15 protons, 16 neutrons, 15 electrons",
      interactions: {
        1: "Forms phosphine (PH₃)",
        8: "Forms phosphoric acid (H₃PO₄)",
        17: "Forms phosphorus trichloride (PCl₃)"
      },
      description: "Essential for life, exists in multiple forms"
    },
    16: {
      number: 16,
      symbol: "S",
      name: "Sulfur",
      group: 16,
      period: 3,
      category: "polyatomic nonmetal",
      electronegativity: 2.58,
      structure: "16 protons, 16 neutrons, 16 electrons",
      interactions: {
        1: "Forms hydrogen sulfide (H₂S)",
        6: "Forms carbon disulfide (CS₂)",
        8: "Forms sulfur dioxide (SO₂)"
      },
      description: "Yellow, brittle, forms rings or chains"
    },
    17: {
      number: 17,
      symbol: "Cl",
      name: "Chlorine",
      group: 17,
      period: 3,
      category: "halogen",
      electronegativity: 3.16,
      structure: "17 protons, 18 neutrons, 17 electrons",
      interactions: {
        1: "Forms hydrogen chloride (HCl)",
        3: "Forms lithium chloride (LiCl)",
        11: "Forms sodium chloride (NaCl)",
        13: "Forms aluminum chloride (AlCl₃)"
      },
      description: "Reactive halogen, greenish-yellow gas"
    },
    18: {
      number: 18,
      symbol: "Ar",
      name: "Argon",
      group: 18,
      period: 3,
      category: "noble gas",
      electronegativity: null,
      structure: "18 protons, 22 neutrons, 18 electrons",
      interactions: {
        1: "No stable compounds",
        9: "No stable compounds"
      },
      description: "Third most abundant gas in atmosphere"
    },
    19: {
      number: 19,
      symbol: "K",
      name: "Potassium",
      group: 1,
      period: 4,
      category: "alkali metal",
      electronegativity: 0.82,
      structure: "19 protons, 20 neutrons, 19 electrons",
      interactions: {
        8: "Forms potassium oxide (K₂O)",
        9: "Forms potassium fluoride (KF)",
        17: "Forms potassium chloride (KCl)"
      },
      description: "Soft, reactive metal, essential for plants"
    },
    20: {
      number: 20,
      symbol: "Ca",
      name: "Calcium",
      group: 2,
      period: 4,
      category: "alkaline earth metal",
      electronegativity: 1.00,
      structure: "20 protons, 20 neutrons, 20 electrons",
      interactions: {
        8: "Forms calcium oxide (CaO)",
        9: "Forms calcium fluoride (CaF₂)",
        17: "Forms calcium chloride (CaCl₂)"
      },
      description: "Essential for bones, abundant in limestone"
    },
    21: {
      number: 21,
      symbol: "Sc",
      name: "Scandium",
      group: 3,
      period: 4,
      category: "transition metal",
      electronegativity: 1.36,
      structure: "21 protons, 24 neutrons, 21 electrons",
      interactions: {
        8: "Forms scandium oxide (Sc₂O₃)",
        9: "Forms scandium fluoride (ScF₃)"
      },
      description: "Rare earth metal, used in alloys"
    },
    22: {
      number: 22,
      symbol: "Ti",
      name: "Titanium",
      group: 4,
      period: 4,
      category: "transition metal",
      electronegativity: 1.54,
      structure: "22 protons, 26 neutrons, 22 electrons",
      interactions: {
        8: "Forms titanium dioxide (TiO₂)",
        17: "Forms titanium tetrachloride (TiCl₄)"
      },
      description: "Strong, lightweight, corrosion-resistant"
    },
    23: {
      number: 23,
      symbol: "V",
      name: "Vanadium",
      group: 5,
      period: 4,
      category: "transition metal",
      electronegativity: 1.63,
      structure: "23 protons, 28 neutrons, 23 electrons",
      interactions: {
        8: "Forms vanadium pentoxide (V₂O₅)"
      },
      description: "Used in steel alloys, multiple oxidation states"
    },
    24: {
      number: 24,
      symbol: "Cr",
      name: "Chromium",
      group: 6,
      period: 4,
      category: "transition metal",
      electronegativity: 1.66,
      structure: "24 protons, 28 neutrons, 24 electrons",
      interactions: {
        8: "Forms chromium trioxide (CrO₃)"
      },
      description: "Shiny, corrosion-resistant, used in plating"
    },
    25: {
      number: 25,
      symbol: "Mn",
      name: "Manganese",
      group: 7,
      period: 4,
      category: "transition metal",
      electronegativity: 1.55,
      structure: "25 protons, 30 neutrons, 25 electrons",
      interactions: {
        8: "Forms manganese dioxide (MnO₂)"
      },
      description: "Used in steel production, multiple states"
    },
    26: {
      number: 26,
      symbol: "Fe",
      name: "Iron",
      group: 8,
      period: 4,
      category: "transition metal",
      electronegativity: 1.83,
      structure: "26 protons, 30 neutrons, 26 electrons",
      interactions: {
        8: "Forms iron oxides (e.g., Fe₂O₃)",
        17: "Forms iron chloride (FeCl₃)"
      },
      description: "Basis of steel, magnetic"
    },
    27: {
      number: 27,
      symbol: "Co",
      name: "Cobalt",
      group: 9,
      period: 4,
      category: "transition metal",
      electronegativity: 1.88,
      structure: "27 protons, 32 neutrons, 27 electrons",
      interactions: {
        8: "Forms cobalt oxide (CoO)"
      },
      description: "Used in magnets, blue pigment"
    },
    28: {
      number: 28,
      symbol: "Ni",
      name: "Nickel",
      group: 10,
      period: 4,
      category: "transition metal",
      electronegativity: 1.91,
      structure: "28 protons, 31 neutrons, 28 electrons",
      interactions: {
        8: "Forms nickel oxide (NiO)"
      },
      description: "Corrosion-resistant, used in coins"
    },
    29: {
      number: 29,
      symbol: "Cu",
      name: "Copper",
      group: 11,
      period: 4,
      category: "transition metal",
      electronegativity: 1.90,
      structure: "29 protons, 35 neutrons, 29 electrons",
      interactions: {
        8: "Forms copper oxide (CuO)",
        16: "Forms copper sulfide (CuS)"
      },
      description: "Excellent conductor, reddish metal"
    },
    30: {
      number: 30,
      symbol: "Zn",
      name: "Zinc",
      group: 12,
      period: 4,
      category: "transition metal",
      electronegativity: 1.65,
      structure: "30 protons, 35 neutrons, 30 electrons",
      interactions: {
        8: "Forms zinc oxide (ZnO)",
        16: "Forms zinc sulfide (ZnS)"
      },
      description: "Used in galvanizing, corrosion-resistant"
    },
    31: {
      number: 31,
      symbol: "Ga",
      name: "Gallium",
      group: 13,
      period: 4,
      category: "post-transition metal",
      electronegativity: 1.81,
      structure: "31 protons, 39 neutrons, 31 electrons",
      interactions: {
        8: "Forms gallium oxide (Ga₂O₃)"
      },
      description: "Low melting point, used in electronics"
    },
    32: {
      number: 32,
      symbol: "Ge",
      name: "Germanium",
      group: 14,
      period: 4,
      category: "metalloid",
      electronegativity: 2.01,
      structure: "32 protons, 41 neutrons, 32 electrons",
      interactions: {
        8: "Forms germanium dioxide (GeO₂)"
      },
      description: "Semiconductor, similar to silicon"
    },
    33: {
      number: 33,
      symbol: "As",
      name: "Arsenic",
      group: 15,
      period: 4,
      category: "metalloid",
      electronegativity: 2.18,
      structure: "33 protons, 42 neutrons, 33 electrons",
      interactions: {
        8: "Forms arsenic trioxide (As₂O₃)"
      },
      description: "Toxic metalloid, used in pesticides"
    },
    34: {
      number: 34,
      symbol: "Se",
      name: "Selenium",
      group: 16,
      period: 4,
      category: "polyatomic nonmetal",
      electronegativity: 2.55,
      structure: "34 protons, 45 neutrons, 34 electrons",
      interactions: {
        1: "Forms hydrogen selenide (H₂Se)"
      },
      description: "Used in electronics, essential trace element"
    },
    35: {
      number: 35,
      symbol: "Br",
      name: "Bromine",
      group: 17,
      period: 4,
      category: "halogen",
      electronegativity: 2.96,
      structure: "35 protons, 45 neutrons, 35 electrons",
      interactions: {
        1: "Forms hydrogen bromide (HBr)",
        11: "Forms sodium bromide (NaBr)",
        19: "Forms potassium bromide (KBr)"
      },
      description: "Red-brown liquid, reactive halogen"
    },
    36: {
      number: 36,
      symbol: "Kr",
      name: "Krypton",
      group: 18,
      period: 4,
      category: "noble gas",
      electronegativity: null,
      structure: "36 protons, 48 neutrons, 36 electrons",
      interactions: {
        9: "Forms krypton difluoride (KrF₂) (rare)"
      },
      description: "Inert gas, used in lighting"
    },
    37: {
      number: 37,
      symbol: "Rb",
      name: "Rubidium",
      group: 1,
      period: 5,
      category: "alkali metal",
      electronegativity: 0.82,
      structure: "37 protons, 48 neutrons, 37 electrons",
      interactions: {
        17: "Forms rubidium chloride (RbCl)"
      },
      description: "Soft, highly reactive metal"
    },
    38: {
      number: 38,
      symbol: "Sr",
      name: "Strontium",
      group: 2,
      period: 5,
      category: "alkaline earth metal",
      electronegativity: 0.95,
      structure: "38 protons, 50 neutrons, 38 electrons",
      interactions: {
        8: "Forms strontium oxide (SrO)"
      },
      description: "Used in fireworks, similar to calcium"
    },
    39: {
      number: 39,
      symbol: "Y",
      name: "Yttrium",
      group: 3,
      period: 5,
      category: "transition metal",
      electronegativity: 1.22,
      structure: "39 protons, 50 neutrons, 39 electrons",
      interactions: {
        8: "Forms yttrium oxide (Y₂O₃)"
      },
      description: "Rare earth metal, used in superconductors"
    },
    40: {
      number: 40,
      symbol: "Zr",
      name: "Zirconium",
      group: 4,
      period: 5,
      category: "transition metal",
      electronegativity: 1.33,
      structure: "40 protons, 51 neutrons, 40 electrons",
      interactions: {
        8: "Forms zirconium dioxide (ZrO₂)"
      },
      description: "Corrosion-resistant, used in nuclear reactors"
    },
    41: {
      number: 41,
      symbol: "Nb",
      name: "Niobium",
      group: 5,
      period: 5,
      category: "transition metal",
      electronegativity: 1.6,
      structure: "41 protons, 52 neutrons, 41 electrons",
      interactions: {
        8: "Forms niobium pentoxide (Nb₂O₅)"
      },
      description: "Used in alloys, superconducting"
    },
    42: {
      number: 42,
      symbol: "Mo",
      name: "Molybdenum",
      group: 6,
      period: 5,
      category: "transition metal",
      electronegativity: 2.16,
      structure: "42 protons, 54 neutrons, 42 electrons",
      interactions: {
        8: "Forms molybdenum trioxide (MoO₃)"
      },
      description: "High melting point, used in steel"
    },
    43: {
      number: 43,
      symbol: "Tc",
      name: "Technetium",
      group: 7,
      period: 5,
      category: "transition metal",
      electronegativity: 1.9,
      structure: "43 protons, 55 neutrons, 43 electrons",
      interactions: {},
      description: "Radioactive, synthetic, used in medicine"
    },
    44: {
      number: 44,
      symbol: "Ru",
      name: "Ruthenium",
      group: 8,
      period: 5,
      category: "transition metal",
      electronegativity: 2.2,
      structure: "44 protons, 57 neutrons, 44 electrons",
      interactions: {
        8: "Forms ruthenium dioxide (RuO₂)"
      },
      description: "Rare, used in catalysis"
    },
    45: {
      number: 45,
      symbol: "Rh",
      name: "Rhodium",
      group: 9,
      period: 5,
      category: "transition metal",
      electronegativity: 2.28,
      structure: "45 protons, 58 neutrons, 45 electrons",
      interactions: {},
      description: "Used in catalysis, highly reflective"
    },
    46: {
      number: 46,
      symbol: "Pd",
      name: "Palladium",
      group: 10,
      period: 5,
      category: "transition metal",
      electronegativity: 2.20,
      structure: "46 protons, 60 neutrons, 46 electrons",
      interactions: {
        8: "Forms palladium oxide (PdO)"
      },
      description: "Catalytic properties, used in converters"
    },
    47: {
      number: 47,
      symbol: "Ag",
      name: "Silver",
      group: 11,
      period: 5,
      category: "transition metal",
      electronegativity: 1.93,
      structure: "47 protons, 61 neutrons, 47 electrons",
      interactions: {
        16: "Forms silver sulfide (Ag₂S)"
      },
      description: "Best electrical conductor, precious metal"
    },
    48: {
      number: 48,
      symbol: "Cd",
      name: "Cadmium",
      group: 12,
      period: 5,
      category: "transition metal",
      electronegativity: 1.69,
      structure: "48 protons, 64 neutrons, 48 electrons",
      interactions: {
        16: "Forms cadmium sulfide (CdS)"
      },
      description: "Toxic metal, used in batteries"
    },
    49: {
      number: 49,
      symbol: "In",
      name: "Indium",
      group: 13,
      period: 5,
      category: "post-transition metal",
      electronegativity: 1.78,
      structure: "49 protons, 66 neutrons, 49 electrons",
      interactions: {
        8: "Forms indium oxide (In₂O₃)"
      },
      description: "Soft, malleable, used in electronics"
    },
    50: {
      number: 50,
      symbol: "Sn",
      name: "Tin",
      group: 14,
      period: 5,
      category: "post-transition metal",
      electronegativity: 1.96,
      structure: "50 protons, 69 neutrons, 50 electrons",
      interactions: {
        8: "Forms tin dioxide (SnO₂)"
      },
      description: "Used in alloys, corrosion-resistant"
    },
    51: {
      number: 51,
      symbol: "Sb",
      name: "Antimony",
      group: 15,
      period: 5,
      category: "metalloid",
      electronegativity: 2.05,
      structure: "51 protons, 71 neutrons, 51 electrons",
      interactions: {
        8: "Forms antimony trioxide (Sb₂O₃)"
      },
      description: "Brittle metalloid, used in alloys"
    },
    52: {
      number: 52,
      symbol: "Te",
      name: "Tellurium",
      group: 16,
      period: 5,
      category: "metalloid",
      electronegativity: 2.1,
      structure: "52 protons, 76 neutrons, 52 electrons",
      interactions: {
        1: "Forms hydrogen telluride (H₂Te)"
      },
      description: "Semiconductor, brittle"
    },
    53: {
      number: 53,
      symbol: "I",
      name: "Iodine",
      group: 17,
      period: 5,
      category: "halogen",
      electronegativity: 2.66,
      structure: "53 protons, 74 neutrons, 53 electrons",
      interactions: {
        1: "Forms hydrogen iodide (HI)",
        11: "Forms sodium iodide (NaI)"
      },
      description: "Violet solid, essential for thyroid"
    },
    54: {
      number: 54,
      symbol: "Xe",
      name: "Xenon",
      group: 18,
      period: 5,
      category: "noble gas",
      electronegativity: null,
      structure: "54 protons, 77 neutrons, 54 electrons",
      interactions: {
        9: "Forms xenon tetrafluoride (XeF₄)"
      },
      description: "Inert gas, used in lamps"
    },
    55: {
      number: 55,
      symbol: "Cs",
      name: "Cesium",
      group: 1,
      period: 6,
      category: "alkali metal",
      electronegativity: 0.79,
      structure: "55 protons, 78 neutrons, 55 electrons",
      interactions: {
        17: "Forms cesium chloride (CsCl)"
      },
      description: "Very reactive, used in atomic clocks"
    },
    56: {
      number: 56,
      symbol: "Ba",
      name: "Barium",
      group: 2,
      period: 6,
      category: "alkaline earth metal",
      electronegativity: 0.89,
      structure: "56 protons, 81 neutrons, 56 electrons",
      interactions: {
        8: "Forms barium oxide (BaO)"
      },
      description: "Used in X-ray imaging, reactive"
    },
    57: {
      number: 57,
      symbol: "La",
      name: "Lanthanum",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.1,
      structure: "57 protons, 82 neutrons, 57 electrons",
      interactions: {
        8: "Forms lanthanum oxide (La₂O₃)"
      },
      description: "Start of lanthanides, used in optics"
    },
    58: {
      number: 58,
      symbol: "Ce",
      name: "Cerium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.12,
      structure: "58 protons, 82 neutrons, 58 electrons",
      interactions: {
        8: "Forms cerium dioxide (CeO₂)"
      },
      description: "Abundant rare earth, used in polishing"
    },
    59: {
      number: 59,
      symbol: "Pr",
      name: "Praseodymium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.13,
      structure: "59 protons, 82 neutrons, 59 electrons",
      interactions: {},
      description: "Used in magnets, green colorant"
    },
    60: {
      number: 60,
      symbol: "Nd",
      name: "Neodymium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.14,
      structure: "60 protons, 84 neutrons, 60 electrons",
      interactions: {},
      description: "Strong magnets, used in lasers"
    },
    61: {
      number: 61,
      symbol: "Pm",
      name: "Promethium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.13,
      structure: "61 protons, 84 neutrons, 61 electrons",
      interactions: {},
      description: "Radioactive, used in atomic batteries"
    },
    62: {
      number: 62,
      symbol: "Sm",
      name: "Samarium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.17,
      structure: "62 protons, 88 neutrons, 62 electrons",
      interactions: {},
      description: "Used in magnets, radioactive isotopes"
    },
    63: {
      number: 63,
      symbol: "Eu",
      name: "Europium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.2,
      structure: "63 protons, 89 neutrons, 63 electrons",
      interactions: {},
      description: "Phosphorescent, used in lighting"
    },
    64: {
      number: 64,
      symbol: "Gd",
      name: "Gadolinium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.2,
      structure: "64 protons, 93 neutrons, 64 electrons",
      interactions: {},
      description: "MRI contrast agent, magnetic"
    },
    65: {
      number: 65,
      symbol: "Tb",
      name: "Terbium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.2,
      structure: "65 protons, 94 neutrons, 65 electrons",
      interactions: {},
      description: "Green phosphors, magnetic"
    },
    66: {
      number: 66,
      symbol: "Dy",
      name: "Dysprosium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.22,
      structure: "66 protons, 97 neutrons, 66 electrons",
      interactions: {},
      description: "High magnetic strength"
    },
    67: {
      number: 67,
      symbol: "Ho",
      name: "Holmium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.23,
      structure: "67 protons, 98 neutrons, 67 electrons",
      interactions: {},
      description: "Magnetic properties, yellow color"
    },
    68: {
      number: 68,
      symbol: "Er",
      name: "Erbium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.24,
      structure: "68 protons, 99 neutrons, 68 electrons",
      interactions: {},
      description: "Pink colorant, used in lasers"
    },
    69: {
      number: 69,
      symbol: "Tm",
      name: "Thulium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.25,
      structure: "69 protons, 100 neutrons, 69 electrons",
      interactions: {},
      description: "Rare lanthanide, blue-green emission"
    },
    70: {
      number: 70,
      symbol: "Yb",
      name: "Ytterbium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.1,
      structure: "70 protons, 103 neutrons, 70 electrons",
      interactions: {},
      description: "Soft lanthanide, used in doping"
    },
    71: {
      number: 71,
      symbol: "Lu",
      name: "Lutetium",
      group: 3,
      period: 6,
      category: "lanthanide",
      electronegativity: 1.27,
      structure: "71 protons, 104 neutrons, 71 electrons",
      interactions: {},
      description: "End of lanthanides, dense"
    },
    72: {
      number: 72,
      symbol: "Hf",
      name: "Hafnium",
      group: 4,
      period: 6,
      category: "transition metal",
      electronegativity: 1.3,
      structure: "72 protons, 106 neutrons, 72 electrons",
      interactions: {
        8: "Forms hafnium dioxide (HfO₂)"
      },
      description: "High melting point, nuclear applications"
    },
    73: {
      number: 73,
      symbol: "Ta",
      name: "Tantalum",
      group: 5,
      period: 6,
      category: "transition metal",
      electronegativity: 1.5,
      structure: "73 protons, 108 neutrons, 73 electrons",
      interactions: {
        8: "Forms tantalum pentoxide (Ta₂O₅)"
      },
      description: "Corrosion-resistant, used in capacitors"
    },
    74: {
      number: 74,
      symbol: "W",
      name: "Tungsten",
      group: 6,
      period: 6,
      category: "transition metal",
      electronegativity: 2.36,
      structure: "74 protons, 110 neutrons, 74 electrons",
      interactions: {
        8: "Forms tungsten trioxide (WO₃)"
      },
      description: "Highest melting point, used in filaments"
    },
    75: {
      number: 75,
      symbol: "Re",
      name: "Rhenium",
      group: 7,
      period: 6,
      category: "transition metal",
      electronegativity: 1.9,
      structure: "75 protons, 111 neutrons, 75 electrons",
      interactions: {},
      description: "Very dense, used in jet engines"
    },
    76: {
      number: 76,
      symbol: "Os",
      name: "Osmium",
      group: 8,
      period: 6,
      category: "transition metal",
      electronegativity: 2.2,
      structure: "76 protons, 114 neutrons, 76 electrons",
      interactions: {
        8: "Forms osmium tetroxide (OsO₄)"
      },
      description: "Densest element, hard, blue-gray"
    },
    77: {
      number: 77,
      symbol: "Ir",
      name: "Iridium",
      group: 9,
      period: 6,
      category: "transition metal",
      electronegativity: 2.20,
      structure: "77 protons, 115 neutrons, 77 electrons",
      interactions: {},
      description: "Very corrosion-resistant, dense"
    },
    78: {
      number: 78,
      symbol: "Pt",
      name: "Platinum",
      group: 10,
      period: 6,
      category: "transition metal",
      electronegativity: 2.28,
      structure: "78 protons, 117 neutrons, 78 electrons",
      interactions: {},
      description: "Precious metal, catalytic properties"
    },
    79: {
      number: 79,
      symbol: "Au",
      name: "Gold",
      group: 11,
      period: 6,
      category: "transition metal",
      electronegativity: 2.54,
      structure: "79 protons, 118 neutrons, 79 electrons",
      interactions: {
        16: "Forms gold sulfide (Au₂S)"
      },
      description: "Highly malleable, precious metal"
    },
    80: {
      number: 80,
      symbol: "Hg",
      name: "Mercury",
      group: 12,
      period: 6,
      category: "transition metal",
      electronegativity: 2.00,
      structure: "80 protons, 121 neutrons, 80 electrons",
      interactions: {
        16: "Forms mercury sulfide (HgS)"
      },
      description: "Liquid metal, toxic, used in thermometers"
    },
    81: {
      number: 81,
      symbol: "Tl",
      name: "Thallium",
      group: 13,
      period: 6,
      category: "post-transition metal",
      electronegativity: 1.62,
      structure: "81 protons, 123 neutrons, 81 electrons",
      interactions: {
        8: "Forms thallium oxide (Tl₂O)"
      },
      description: "Toxic metal, soft"
    },
    82: {
      number: 82,
      symbol: "Pb",
      name: "Lead",
      group: 14,
      period: 6,
      category: "post-transition metal",
      electronegativity: 2.33,
      structure: "82 protons, 125 neutrons, 82 electrons",
      interactions: {
        8: "Forms lead dioxide (PbO₂)"
      },
      description: "Dense, toxic, used in batteries"
    },
    83: {
      number: 83,
      symbol: "Bi",
      name: "Bismuth",
      group: 15,
      period: 6,
      category: "post-transition metal",
      electronegativity: 2.02,
      structure: "83 protons, 126 neutrons, 83 electrons",
      interactions: {
        8: "Forms bismuth trioxide (Bi₂O₃)"
      },
      description: "Low toxicity, used in medicine"
    },
    84: {
      number: 84,
      symbol: "Po",
      name: "Polonium",
      group: 16,
      period: 6,
      category: "metalloid",
      electronegativity: 2.0,
      structure: "84 protons, 125 neutrons, 84 electrons",
      interactions: {},
      description: "Radioactive, rare, highly toxic"
    },
    85: {
      number: 85,
      symbol: "At",
      name: "Astatine",
      group: 17,
      period: 6,
      category: "halogen",
      electronegativity: 2.2,
      structure: "85 protons, 125 neutrons, 85 electrons",
      interactions: {},
      description: "Rare, radioactive halogen"
    },
    86: {
      number: 86,
      symbol: "Rn",
      name: "Radon",
      group: 18,
      period: 6,
      category: "noble gas",
      electronegativity: null,
      structure: "86 protons, 136 neutrons, 86 electrons",
      interactions: {},
      description: "Radioactive gas, health hazard"
    },
    87: {
      number: 87,
      symbol: "Fr",
      name: "Francium",
      group: 1,
      period: 7,
      category: "alkali metal",
      electronegativity: 0.7,
      structure: "87 protons, 136 neutrons, 87 electrons",
      interactions: {},
      description: "Extremely rare, highly radioactive"
    },
    88: {
      number: 88,
      symbol: "Ra",
      name: "Radium",
      group: 2,
      period: 7,
      category: "alkaline earth metal",
      electronegativity: 0.9,
      structure: "88 protons, 138 neutrons, 88 electrons",
      interactions: {
        8: "Forms radium oxide (RaO)"
      },
      description: "Radioactive, glows in dark"
    },
    89: {
      number: 89,
      symbol: "Ac",
      name: "Actinium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.1,
      structure: "89 protons, 138 neutrons, 89 electrons",
      interactions: {},
      description: "Start of actinides, radioactive"
    },
    90: {
      number: 90,
      symbol: "Th",
      name: "Thorium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "90 protons, 142 neutrons, 90 electrons",
      interactions: {
        8: "Forms thorium dioxide (ThO₂)"
      },
      description: "Radioactive, potential nuclear fuel"
    },
    91: {
      number: 91,
      symbol: "Pa",
      name: "Protactinium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.5,
      structure: "91 protons, 140 neutrons, 91 electrons",
      interactions: {},
      description: "Rare, radioactive, toxic"
    },
    92: {
      number: 92,
      symbol: "U",
      name: "Uranium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.38,
      structure: "92 protons, 146 neutrons, 92 electrons",
      interactions: {
        9: "Forms uranium hexafluoride (UF₆)"
      },
      description: "Nuclear fuel, radioactive"
    },
    93: {
      number: 93,
      symbol: "Np",
      name: "Neptunium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.36,
      structure: "93 protons, 144 neutrons, 93 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    94: {
      number: 94,
      symbol: "Pu",
      name: "Plutonium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.28,
      structure: "94 protons, 150 neutrons, 94 electrons",
      interactions: {},
      description: "Nuclear material, highly radioactive"
    },
    95: {
      number: 95,
      symbol: "Am",
      name: "Americium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "95 protons, 148 neutrons, 95 electrons",
      interactions: {},
      description: "Radioactive, used in smoke detectors"
    },
    96: {
      number: 96,
      symbol: "Cm",
      name: "Curium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "96 protons, 151 neutrons, 96 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    97: {
      number: 97,
      symbol: "Bk",
      name: "Berkelium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "97 protons, 150 neutrons, 97 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    98: {
      number: 98,
      symbol: "Cf",
      name: "Californium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "98 protons, 153 neutrons, 98 electrons",
      interactions: {},
      description: "Synthetic, used in neutron sources"
    },
    99: {
      number: 99,
      symbol: "Es",
      name: "Einsteinium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "99 protons, 153 neutrons, 99 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    100: {
      number: 100,
      symbol: "Fm",
      name: "Fermium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "100 protons, 157 neutrons, 100 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    101: {
      number: 101,
      symbol: "Md",
      name: "Mendelevium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "101 protons, 157 neutrons, 101 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    102: {
      number: 102,
      symbol: "No",
      name: "Nobelium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "102 protons, 157 neutrons, 102 electrons",
      interactions: {},
      description: "Synthetic, radioactive"
    },
    103: {
      number: 103,
      symbol: "Lr",
      name: "Lawrencium",
      group: 3,
      period: 7,
      category: "actinide",
      electronegativity: 1.3,
      structure: "103 protons, 159 neutrons, 103 electrons",
      interactions: {},
      description: "End of actinides, synthetic"
    },
    104: {
      number: 104,
      symbol: "Rf",
      name: "Rutherfordium",
      group: 4,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "104 protons, 157 neutrons, 104 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    105: {
      number: 105,
      symbol: "Db",
      name: "Dubnium",
      group: 5,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "105 protons, 157 neutrons, 105 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    106: {
      number: 106,
      symbol: "Sg",
      name: "Seaborgium",
      group: 6,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "106 protons, 157 neutrons, 106 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    107: {
      number: 107,
      symbol: "Bh",
      name: "Bohrium",
      group: 7,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "107 protons, 157 neutrons, 107 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    108: {
      number: 108,
      symbol: "Hs",
      name: "Hassium",
      group: 8,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "108 protons, 157 neutrons, 108 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    109: {
      number: 109,
      symbol: "Mt",
      name: "Meitnerium",
      group: 9,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "109 protons, 157 neutrons, 109 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    110: {
      number: 110,
      symbol: "Ds",
      name: "Darmstadtium",
      group: 10,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "110 protons, 159 neutrons, 110 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    111: {
      number: 111,
      symbol: "Rg",
      name: "Roentgenium",
      group: 11,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "111 protons, 161 neutrons, 111 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    112: {
      number: 112,
      symbol: "Cn",
      name: "Copernicium",
      group: 12,
      period: 7,
      category: "transition metal",
      electronegativity: null,
      structure: "112 protons, 165 neutrons, 112 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    113: {
      number: 113,
      symbol: "Nh",
      name: "Nihonium",
      group: 13,
      period: 7,
      category: "post-transition metal",
      electronegativity: null,
      structure: "113 protons, 171 neutrons, 113 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    114: {
      number: 114,
      symbol: "Fl",
      name: "Flerovium",
      group: 14,
      period: 7,
      category: "post-transition metal",
      electronegativity: null,
      structure: "114 protons, 175 neutrons, 114 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    115: {
      number: 115,
      symbol: "Mc",
      name: "Moscovium",
      group: 15,
      period: 7,
      category: "post-transition metal",
      electronegativity: null,
      structure: "115 protons, 173 neutrons, 115 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    116: {
      number: 116,
      symbol: "Lv",
      name: "Livermorium",
      group: 16,
      period: 7,
      category: "post-transition metal",
      electronegativity: null,
      structure: "116 protons, 177 neutrons, 116 electrons",
      interactions: {},
      description: "Synthetic, short half-life"
    },
    117: {
      number: 117,
      symbol: "Ts",
      name: "Tennessine",
      group: 17,
      period: 7,
      category: "halogen",
      electronegativity: null,
      structure: "117 protons, 177 neutrons, 117 electrons",
      interactions: {},
      description: "Synthetic, short half-life, possible halogen"
    },
    118: {
      number: 118,
      symbol: "Og",
      name: "Oganesson",
      group: 18,
      period: 7,
      category: "noble gas",
      electronegativity: null,
      structure: "118 protons, 176 neutrons, 118 electrons",
      interactions: {},
      description: "Synthetic, short half-life, possible noble gas"
    }
  };