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


    croppedImagesArray.forEach((image, index) => {
        const blob = dataURItoBlob(image);
        formData.append('productImages', blob, `croppedImage${index}.png`);
    });


    fetch('/admin/addProduct', {
        method: 'POST',
        body: formData
    })
        .then(async response => {
            if (response.ok) {
                const data = await response.json();
                Swal.fire({
                    icon: 'success',
                    title: "Success",
                    text: "product added successfully",
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
                text: error.message || "An error occurred while adding the product"
            });
        });


}

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



function validateForm() {
    clearErrorMessage();
    const name = document.getElementsByName("productName")[0].value.trim();
    const description = document.getElementById("descriptionId").value.trim();
    const salePriceInput = document.getElementById('variation-0-salePrice').value.trim();
    const regularPriceInput = document.getElementById('variation-0-regularPrice').value.trim();
    const quantityInput = document.getElementById('variation-0-quantity').value.trim();
    const category = document.getElementsByName('category')[0].value;
    const status = document.getElementsByName('status')[0].value;

    // Use parseFloat for prices and parseInt for quantity
    const parsedQuantity = parseInt(quantityInput);
    const parsedRegularPrice = parseFloat(regularPriceInput);
    const parsedSalePrice = parseFloat(salePriceInput);

    let isValid = true;

    // --- Name Validation ---
    if (name === "") {
        displayErrorMessage("name-error", "Please enter a name")
        isValid = false
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage("name-error", "Product name should contain only alphabetical characters")
        isValid = false
    }
    
    // --- Description Validation ---
    if (description === "") {
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
    
    // --- Regular Price Validation ---
    if (regularPriceInput === "" || isNaN(parsedRegularPrice) || parsedRegularPrice <= 0) {
        displayErrorMessage("regularPrice-error", "Please enter a valid Regular Price (greater than 0)")
        isValid = false
    }

    // --- Sale Price Validation ---
    if (salePriceInput === "" || isNaN(parsedSalePrice) || parsedSalePrice < 0) {
        displayErrorMessage("salePrice-error", "Please enter a valid Sale Price (0 or greater)")
        isValid = false
    } 
    // Sale Price vs Regular Price Check
    else if (!isNaN(parsedRegularPrice) && parsedRegularPrice > 0 && parsedSalePrice >= parsedRegularPrice) {
        displayErrorMessage("salePrice-error", "Sale Price cannot be greater than or equal to Regular Price")
        isValid = false
    }

    // --- Quantity Validation ---
    if (quantityInput === "" || isNaN(parsedQuantity) || parsedQuantity < 0) {
        displayErrorMessage("quantity-error", "Please enter a valid Product Quantity (0 or greater)")
        isValid = false
    }

    // --- Image Count Validation ---
    if (croppedImagesArray.length < 4) {
        displayErrorMessage("images-error", "Please select at least four images");
        isValid = false;
    }

    return isValid;
}


function displayErrorMessage(elementId, message) {
    var errorElement = document.getElementById(elementId)
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
    } else {
        console.error("Error element not found:", elementId);
    }
}

function clearErrorMessage() {
    var errorElements = document.getElementsByClassName("error-message")
    Array.from(errorElements).forEach((element) => {
        element.innerText = "";
        element.style.display = "none"
    })

}

//image cropping and preview of cropped images

let croppedImagesArray = [];


// NOTE: The original `previewImages` function is no longer needed
// because Croppie handles image binding/previewing/removal more cleanly.
// I'm keeping the original Croppie setup and event listeners below.

const upload = document.querySelector("#productImages");
const cropButton = document.querySelector('#btnCrop');
const croppieContainer = document.querySelector('#CroppieContainer');
const imagePreview = document.querySelector('#imagePreview');
var CroppieContainer = document.getElementById("CroppieContainer")
let currentFile = null;

let croppieInstance = new Croppie(document.createElement('div'), {
    viewport: { width: 150, height: 150, type: 'square' },
    boundary: { width: 250, height: 250 },
    enableResize: true
});
croppieContainer.appendChild(croppieInstance.element);


upload.addEventListener('change', function (e) {
    currentFile = e.target.files[0];

    // --- INTEGRATE VALIDATION HERE ---
    if (!currentFile || !validateNewFile(currentFile)) {
        // Clear the input and hide Croppie if validation fails
        upload.value = '';
        cropButton.style.display = 'none';
        CroppieContainer.style.display = 'none';
        return;
    }
    // --- END INTEGRATE VALIDATION ---
    
    const reader = new FileReader();
    reader.onload = function (event) {
        croppieInstance.bind({
            url: event.target.result
        });
    };
    reader.readAsDataURL(currentFile);

    cropButton.style.display = 'block';
    CroppieContainer.style.display = 'block';
});

cropButton.addEventListener('click', function () {
    croppieInstance.result('canvas').then(function (croppedImage) {
        croppedImagesArray.push(croppedImage);  // Add cropped image to array

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');
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
            const index = croppedImagesArray.indexOf(croppedImage);
            if (index > -1) {
                croppedImagesArray.splice(index, 1);
            }
            imgContainer.remove();
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        imagePreview.appendChild(imgContainer);

        upload.value = '';
        cropButton.style.display = 'none';
        CroppieContainer.style.display = 'none';

    });
});

function validateNewFile(file) {
    const validTypes = ['image/jpeg', 'image/png'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit (Adjust if necessary)

    if (!validTypes.includes(file.type)) {
        displayErrorMessage('images-error', 'Only JPG and PNG file formats are allowed.');
        return false;
    }
    if (file.size > maxFileSize) {
        displayErrorMessage('images-error', 'Maximum file size is 10MB.');
        return false;
    }
    return true;
}