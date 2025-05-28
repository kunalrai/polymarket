  // Three.js background animation
        let scene, camera, renderer, particles;

        function initBackground() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);

            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];

            for (let i = 0; i < 2000; i++) {
                positions.push((Math.random() - 0.5) * 2000);
                positions.push((Math.random() - 0.5) * 2000);
                positions.push((Math.random() - 0.5) * 2000);
                colors.push(Math.random(), Math.random(), 1);
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({ size: 2, vertexColors: true });
            particles = new THREE.Points(geometry, material);
            scene.add(particles);

            camera.position.z = 1000;
        }

        function animateBackground() {
            requestAnimationFrame(animateBackground);
            if (particles) {
                particles.rotation.x += 0.0005;
                particles.rotation.y += 0.001;
            }
            renderer.render(scene, camera);
        }

        // Initialize
        window.addEventListener('load', () => {
            initBackground();
            animateBackground();
        });