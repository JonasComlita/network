const getInteractionText = (selectedElements, elementMap) => {
    if (selectedElements.length < 2) return "";
    
    let interactionText = "";
    
    for (let i = 0; i < selectedElements.length; i++) {
      for (let j = i + 1; j < selectedElements.length; j++) {
        const element1 = elementMap[selectedElements[i]];
        const element2 = elementMap[selectedElements[j]];
        
        if (element1 && element2) {
          const diffEN = Math.abs(
            (element1.electronegativity || 0) - 
            (element2.electronegativity || 0)
          );
          const bondInfo = BondCalculator.determineBondType(
            element1.number, 
            element2.number, 
            diffEN
          );
          
          const bondText = `<span style="color:${bondInfo.color}; font-weight: bold;">${bondInfo.type}</span>`;
          
          let interactionDetails = element1.interactions[element2.number] ||
                                  element2.interactions[element1.number] ||
                                  `No specific interaction data for ${element1.symbol} and ${element2.symbol}.`;
          
          interactionText += `
            <div style="margin-bottom:12px">
              <div>${element1.symbol} + ${element2.symbol} → ${interactionDetails}</div>
              <div><b>Bond type:</b> ${bondText}</div>
              <div><b>Description:</b> ${bondInfo.description}</div>
              <div><b>Strength:</b> ${bondInfo.strength}</div>
              ${bondInfo.additional ? `<div><b>Note:</b> ${bondInfo.additional}</div>` : ''}
              <div style="height:1px;background-color:#666;margin-top:8px"></div>
            </div>`;
        }
      }
    }
    
    return interactionText;
  };