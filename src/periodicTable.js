const PeriodicTable = () => {
    // State management (without useState)
    let selectedElements = [];
    let currentElement = null;
    let interactions = "";
    let showElementInfo = false;
    let showInteractions = false;
  
    // Scene setup function
    function initScene() {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050505);
  
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 30);
  
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
  
      const mount = document.createElement('div');
      mount.className = 'flex-grow w-full';
      document.body.appendChild(mount);
      mount.appendChild(renderer.domElement);
  
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 10, 10);
      scene.add(directionalLight);
  
      const tableGroup = new THREE.Group();
      scene.add(tableGroup);
  
      const elementCubes = {};
      Object.values(elementMap).forEach(element => {
        const x = element.group * 1.5 - 10;
        const y = -(element.period * 1.5) + 5;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
          color: element.category.includes('metal') ? 0xB0C4DE : 0x00CED1,
          specular: 0x444444,
          shininess: 30
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, y, 0);
        cube.userData = { element }; // Store element data in cube
        elementCubes[element.number] = cube;
        tableGroup.add(cube);
      });
  
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
  
      // Click handler
      function handleClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(tableGroup.children);
  
        if (intersects.length > 0) {
          const selectedCube = intersects[0].object;
          const element = selectedCube.userData.element;
  
          // Toggle selection
          const elementNumber = element.number;
          if (selectedElements.includes(elementNumber)) {
            selectedElements = selectedElements.filter(num => num !== elementNumber);
            selectedCube.material.emissive.setHex(0x000000); // Deselect highlight
          } else {
            selectedElements.push(elementNumber);
            selectedCube.material.emissive.setHex(0x555555); // Selection highlight
          }
  
          // Update current element and info
          currentElement = element;
          showElementInfo = true;
  
          // Update interactions if two or more elements are selected
          if (selectedElements.length >= 2) {
            interactions = getInteractionText(selectedElements, elementMap);
            showInteractions = true;
          } else {
            interactions = "";
            showInteractions = false;
          }
  
          // Re-render UI
          renderUI();
        }
      }
  
      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
      animate();
  
      // Add click listener
      window.addEventListener('click', handleClick);
  
      return mount;
    }
  
    // UI rendering function
    function renderUI() {
      const children = [
        React.createElement('div', {
          ref: (el) => {
            if (el && !el.children.length) {
              const mount = initScene();
              el.appendChild(mount);
            }
          },
          className: 'flex-grow w-full'
        })
      ];
  
      // Element info panel
      if (showElementInfo && currentElement) {
        children.push(
          React.createElement(
            'div',
            { className: 'absolute bottom-0 left-0 bg-slate-800 text-white p-4 m-4 rounded-lg max-w-lg shadow-lg' },
            React.createElement('h2', { className: 'text-2xl font-bold' }, `${currentElement.number}. ${currentElement.name} (${currentElement.symbol})`),
            React.createElement('p', { className: 'text-lg mb-2' }, `Category: ${currentElement.category}`),
            React.createElement('p', { className: 'mb-2' }, currentElement.description),
            React.createElement('h3', { className: 'text-xl font-semibold mb-1' }, 'Atomic Structure'),
            React.createElement('p', null, currentElement.structure)
          )
        );
      }
  
      // Interactions panel
      if (showInteractions) {
        children.push(
          React.createElement(
            'div',
            { className: 'absolute bottom-0 right-0 bg-slate-800 text-white p-4 m-4 rounded-lg max-w-lg shadow-lg' },
            React.createElement('h2', { className: 'text-2xl font-bold' }, 'Element Interactions'),
            React.createElement('p', { className: 'whitespace-pre-line', innerHTML: interactions })
          )
        );
      }
  
      // Re-render the entire component
      ReactDOM.render(
        React.createElement('div', { className: 'flex-col w-full h-screen' }, children),
        document.getElementById('root')
      );
    }
  
    // Initial render
    renderUI();
  };