(function (){
    const BYTES_PER_PIXEL = 4;
    const PAGE_SIZE = 64 * 1024;

    function initFilters({instance, memory}) {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const upload = document.getElementById('upload');
        const filters = document.getElementById('filters');
        const img = new Image();

        let imageData;
        let degree = 0;

        upload.addEventListener('change', e => {
            img.src = URL.createObjectURL(e.target.files[0]);
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                const bytesPerImage = img.width * img.height * BYTES_PER_PIXEL;
                const minimumMemorySize = bytesPerImage * 2;
                if (memory.buffer.byteLength < minimumMemorySize){
                    const pagesNeeded = Math.ceil(minimumMemorySize / PAGE_SIZE);
                    memory.grow(pagesNeeded);
                }
                new Uint8ClampedArray(memory.buffer, 0).set(imageData.data);
            }
        });

    }

    async function initWasmModule() {
        let memory = new WebAssembly.Memory({initial: 1});
        const imports = {
            env: {
                memory,
                abort: function () {
                    throw Error('Error in wasm module')
                }
            }
        };

        const { instance } = await WebAssembly.instantiate(
            await fetch('/build/optimized.wasm').then(r => r.arrayBuffer()),
            imports
        );
        if (instance.exports.memory) {
            memory = instance.exports.memory;
        }
        return {
            instance,
            memory
        }
    }

    initWasmModule().then(initFilters)
})();