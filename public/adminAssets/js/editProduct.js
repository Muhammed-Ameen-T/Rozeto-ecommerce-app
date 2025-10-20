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

    // 1. Existing Images: Get current list from hidden input
    const existingImagesData = JSON.parse(document.getElementById('existingImages').value);
    existingImagesData.forEach((image, index) => {
        // Append the path of the images that are still present
        formData.append('existingImages', image);
    });

    // 2. Removed Images
    removedImages.forEach((image) => {
        formData.append('removedImages', image);
    });

    // 3. New Images (Cropped)
    // Send cropped images as blobs
    croppedImagesArray.forEach((image, index) => {
        const blob = dataURItoBlob(image);
        formData.append('productImages', blob, `croppedImage${index}.png`);
    });

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
                    text: "product Updated successfully",
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

    // Get current total image count
    const existingImages = JSON.parse(document.getElementById('existingImages').value);
    const totalImages = existingImages.length + croppedImagesArray.length;

    let isValid = true;

    // --- Product Name Validation ---
    if (name == "") {
        displayErrorMessage("name-error", "Please enter a name")
        isValid = false
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage("name-error", "Product name should contain only alphabetical characters")
        isValid = false
    }

    // --- Description Validation ---
    if (description == "") {
        displayErrorMessage("description-error", "Please enter a description")
        isValid = false
    }

    // --- Category Validation ---
    if (category === "") {
        displayErrorMessage("category-error", "Please select a category");
        isValid = false;
    }

    // --- Status Validation ---
    if (status === "") {
        displayErrorMessage("status-error", "Please select a status");
        isValid = false;
    }


    // --- Price/Quantity Validation (NEW LOGIC) ---
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
    
    // --- Image Count Validation ---
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

// Initialize Croppie instance
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


document.addEventListener('DOMContentLoaded', () => {
    initCroppie(); // Initialize croppie on load

    // --- Display existing images on load ---
    const existingImages = JSON.parse(document.getElementById('existingImages').value);

    existingImages.forEach((imagePath, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container', 'existing-image-container');
        imgContainer.style.position = 'relative';
        imgContainer.style.display = 'inline-block';
        imgContainer.style.marginRight = '10px';

        const img = document.createElement('img');
        img.src = `/${imagePath.replace(/\\/g, '/')}`; // Ensure correct path format
        img.classList.add('img-thumbnail');
        img.style.maxWidth = '100px';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Remove';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '5px';
        deleteBtn.style.right = '5px';

        deleteBtn.addEventListener('click', () => {
            // Remove image from DOM
            imgContainer.remove();

            // Add path to removedImages array
            removedImages.push(imagePath);

            // Update the hidden existingImages input (important for validation)
            const existingImagesInput = document.getElementById('existingImages');
            let currentExisting = JSON.parse(existingImagesInput.value);
            const pathIndex = currentExisting.indexOf(imagePath);
            if (pathIndex > -1) {
                currentExisting.splice(pathIndex, 1);
                existingImagesInput.value = JSON.stringify(currentExisting);
            }
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        imagePreview.appendChild(imgContainer);
    });
});


// --- Handle new image selection and binding to Croppie ---
upload.addEventListener('change', function (e) {
    if (e.target.files.length === 0) return;
    
    currentFile = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        initCroppie(); // Re-initialize croppie for new file
        croppieInstance.bind({
            url: event.target.result
        });
    };
    reader.readAsDataURL(currentFile);

    cropButton.style.display = 'block';
    croppieContainer.style.display = 'block';
});

// --- Handle image cropping and previewing ---
cropButton.addEventListener('click', function () {
    if (!croppieInstance) return;

    croppieInstance.result('canvas').then(function (croppedImage) {
        croppedImagesArray.push(croppedImage); // Add cropped image to array

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container', 'new-cropped-image');
        imgContainer.style.position = 'relative';
        imgContainer.style.display = 'inline-block';
        imgContainer.style.marginRight = '10px';

        const img = document.createElement('img');
        img.src = croppedImage;
        img.classList.add('img-thumbnail');
        img.style.maxWidth = '100px';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Remove';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '5px';
        deleteBtn.style.right = '5px';

        deleteBtn.addEventListener('click', () => {
            // Remove image from cropped array
            const index = croppedImagesArray.indexOf(croppedImage);
            if (index > -1) {
                croppedImagesArray.splice(index, 1);
            }
            imgContainer.remove();
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
    });
});