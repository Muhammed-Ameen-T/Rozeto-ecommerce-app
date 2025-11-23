// Variable to store Data URIs of newly cropped images
let croppedImagesArray = [];
let removedImages = [];

// Utility function to convert Data URI to Blob (needed for FormData append)
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        console.log("Form validation failed");
        return;
    }

    const formData = new FormData();
    const formElements = event.target.elements;

    formData.append('productName', formElements['productName'].value.trim());
    formData.append('description', formElements['description'].value);
    formData.append('status', formElements['status'].value);
    formData.append('category', formElements['category'].value);
    formData.append('regularPrice', formElements['regularPrice'].value);
    formData.append('salePrice', formElements['salePrice'].value);
    formData.append('quantity', formElements['quantity'].value);

    // 1. Removed Images (paths to be deleted from Cloudinary)
    removedImages.forEach((image) => {
        formData.append('removedImages', image);
    });

    // 2. New Images (Cropped Blobs)
    croppedImagesArray.forEach((image, index) => {
        const blob = dataURItoBlob(image);
        formData.append('productImages', blob, `croppedImage${index}.png`);
    });

    // 3. Existing Images (Still present in the hidden input after removals)
    // The hidden input value is read by the server-side Multer/body parser.

    fetch(`/admin/editProduct/${productId}`, {
        method: 'POST',
        body: formData

    })
        .then(async response => {
            if (response.ok) {
                const data = await response.json();
                Swal.fire({
                    icon: 'success',
                    title: "Success",
                    text: "Product Updated successfully",
                    timer: 2000
                }).then(() => {
                    window.location.href = "/admin/products";
                });
            } else {
                const err = await response.json();
                throw new Error(err.error);
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: "Oops",
                text: error.message || "An error occurred while updating the product"
            });
        });
}


function validateForm() {
    clearErrorMessage();
    const name = document.getElementsByName("productName")[0].value.trim();
    const description = document.getElementById("descriptionId").value.trim();
    const category = document.getElementsByName('category')[0].value;
    const status = document.getElementsByName('status')[0].value;
    
    // Price/Quantity Fields
    const quantityInput = document.getElementById('variation-0-quantity').value.trim();
    const regularPriceInput = document.getElementById('variation-0-regularPrice').value.trim();
    const salePriceInput = document.getElementById('variation-0-salePrice').value.trim();

    const parsedQuantity = parseFloat(quantityInput);
    const parsedRegularPrice = parseFloat(regularPriceInput);
    const parsedSalePrice = parseFloat(salePriceInput);

    // Get current total image count (existing + new cropped)
    const existingImagesHiddenInput = document.getElementById('existingImagesHidden');
    const existingImages = existingImagesHiddenInput ? JSON.parse(existingImagesHiddenInput.value) : [];
    const totalImages = existingImages.length + croppedImagesArray.length;

    let isValid = true;

    // --- Product Name Validation (No Change) ---
    if (name == "") {
        displayErrorMessage("name-error", "Please enter a name")
        isValid = false
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage("name-error", "Product name should contain only alphabetical characters")
        isValid = false
    }

    // --- Description Validation (No Change) ---
    if (description == "") {
        displayErrorMessage("description-error", "Please enter a description")
        isValid = false
    }

    // --- Category Validation (No Change) ---
    if (category === "") {
        displayErrorMessage("category-error", "Please select a category");
        isValid = false;
    }

    // --- Status Validation (No Change) ---
    if (status === "") {
        displayErrorMessage("status-error", "Please select a status");
        isValid = false;
    }

    // --- Price/Quantity Validation (No Change) ---
    if (quantityInput == "" || parsedQuantity < 0 || isNaN(parsedQuantity)) {
        displayErrorMessage("quantity-error", "Please enter a valid Quantity (0 or greater)")
        isValid = false
    }
    
    if (regularPriceInput == "" || parsedRegularPrice <= 0 || isNaN(parsedRegularPrice)) {
        displayErrorMessage("regularPrice-error", "Please enter a valid Regular Price (> 0)")
        isValid = false
    }

    if (salePriceInput == "" || parsedSalePrice < 0 || isNaN(parsedSalePrice)) {
        displayErrorMessage("salePrice-error", "Please enter a valid Sale Price (0 or greater)")
        isValid = false
    } else if (parsedSalePrice >= parsedRegularPrice) {
        displayErrorMessage("salePrice-error", "Sale Price must be less than Regular Price")
        isValid = false
    }
    
    // --- Image Count Validation (No Change) ---
    if (totalImages < 4) {
        displayErrorMessage("images-error", `Please ensure at least 4 images. Current: ${totalImages}`);
        isValid = false;
    } else if (totalImages > 10) {
        displayErrorMessage("images-error", `You can only select at most 10 images. Current: ${totalImages}`);
        isValid = false;
    }


    return isValid;
}


function displayErrorMessage(elementId, message) {
    var errorElement = document.getElementById(elementId)
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
    }
}

function clearErrorMessage() {
    var errorElements = document.getElementsByClassName("error-message")
    Array.from(errorElements).forEach((element) => {
        element.innerText = "";
        element.style.display = "none"
    })
}

// =================================================================
// IMAGE CROP AND PREVIEW LOGIC
// =================================================================

const upload = document.querySelector("#productImages");
const cropButton = document.querySelector('#btnCrop');
const croppieContainer = document.querySelector('#CroppieContainer');
const imagePreview = document.querySelector('#imagePreview');
let currentFile = null;
let croppieInstance = null;
const existingImagesHiddenInput = document.getElementById('existingImagesHidden');


// Initialize Croppie instance (No Change)
function initCroppie() {
    if (croppieInstance) {
        croppieInstance.destroy();
        croppieInstance = null;
    }
    const div = document.createElement('div');
    croppieContainer.innerHTML = '';
    croppieContainer.appendChild(div);
    croppieInstance = new Croppie(div, {
        viewport: { width: 150, height: 150, type: 'square' },
        boundary: { width: 250, height: 250 },
        enableResize: true
    });
}

// New validation function for new files (No Change)
function validateNewFile(file) {
    const validTypes = ['image/jpeg', 'image/png'];
    const maxFileSize = 10 * 1024 * 1024; // Assuming 10MB limit based on product controller

    if (!validTypes.includes(file.type)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid File Type',
            text: 'Only JPG and PNG files are allowed.'
        });
        return false;
    }
    if (file.size > maxFileSize) {
        Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'Maximum file size is 10MB.'
        });
        return false;
    }
    return true;
}

// --- Image removal logic for existing images (No Change) ---
function markExistingImageForRemoval(imageURL, container) {
    // 1. Add to the removedImages array
    removedImages.push(imageURL);

    // 2. Remove from the client-side list of existing images (stored in the hidden input)
    let currentExisting = JSON.parse(existingImagesHiddenInput.value);
    const pathIndex = currentExisting.indexOf(imageURL);
    if (pathIndex > -1) {
        currentExisting.splice(pathIndex, 1);
        existingImagesHiddenInput.value = JSON.stringify(currentExisting);
    }
    
    // 3. Remove from DOM
    container.remove();
    
    // Optional: Log state for debugging
    console.log('Removed Images Array:', removedImages);
    console.log('Updated Existing Images Input:', existingImagesHiddenInput.value);
}


document.addEventListener('DOMContentLoaded', () => {
    initCroppie(); // Initialize croppie on load

    // --- Display existing images on load (FIXED DISPLAY LOGIC) ---
    const existingImages = JSON.parse(existingImagesHiddenInput.value);

    existingImages.forEach((imageURL, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container', 'existing-image-container');
        imgContainer.style.position = 'relative';
        imgContainer.style.display = 'inline-block';
        imgContainer.style.marginRight = '10px';
        imgContainer.setAttribute('data-image-url', imageURL); 
        imgContainer.style.width = '100px'; 
        imgContainer.style.height = '100px'; 

        const img = document.createElement('img');
        img.src = imageURL;
        img.classList.add('img-thumbnail');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'X';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '0';
        deleteBtn.style.right = '0';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.lineHeight = '0';

        deleteBtn.addEventListener('click', () => {
             markExistingImageForRemoval(imageURL, imgContainer);
             validateForm(); 
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        imagePreview.appendChild(imgContainer);
    });
});


// --- Handle new image selection and binding to Croppie (No Change) ---
upload.addEventListener('change', function (e) {
    if (e.target.files.length === 0) return;
    
    currentFile = e.target.files[0];
    
    if (!validateNewFile(currentFile)) {
        upload.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function (event) {
        initCroppie();
        croppieInstance.bind({
            url: event.target.result
        });
        cropButton.style.display = 'block';
        croppieContainer.style.display = 'block';
    };
    reader.readAsDataURL(currentFile);

});

// --- Handle image cropping and previewing (No Change) ---
cropButton.addEventListener('click', function () {
    if (!croppieInstance) return;

    croppieInstance.result('canvas').then(function (croppedImage) {
        croppedImagesArray.push(croppedImage);

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container', 'new-cropped-image');
        imgContainer.style.position = 'relative';
        imgContainer.style.display = 'inline-block';
        imgContainer.style.marginRight = '10px';

        const img = document.createElement('img');
        img.src = croppedImage;
        img.classList.add('img-thumbnail');
        img.style.maxWidth = '100px';
        img.style.maxHeight = '100px';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'X';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '0';
        deleteBtn.style.right = '0';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.lineHeight = '0';

        deleteBtn.addEventListener('click', () => {
            const index = croppedImagesArray.indexOf(croppedImage);
            if (index > -1) {
                croppedImagesArray.splice(index, 1);
            }
            imgContainer.remove();
            validateForm(); 
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        imagePreview.appendChild(imgContainer);

        // Reset inputs and hide Croppie UI
        upload.value = '';
        cropButton.style.display = 'none';
        croppieContainer.style.display = 'none';
        
        // Destroy and re-initialize Croppie
        initCroppie();
        validateForm(); 
    });
});