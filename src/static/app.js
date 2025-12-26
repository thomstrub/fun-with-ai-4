document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const registerForm = document.getElementById("register-form");
  const messageDiv = document.getElementById("message");
  const registerModal = document.getElementById("register-modal");
  const closeModal = document.querySelector(".close-modal");
  const modalCapabilityName = document.getElementById("modal-capability-name");
  const selectedCapabilityInput = document.getElementById("selected-capability");

  // Null check for required DOM elements
  if (
    !capabilitiesList ||
    !registerForm ||
    !messageDiv ||
    !registerModal ||
    !closeModal ||
    !modalCapabilityName ||
    !selectedCapabilityInput
  ) {
    console.error("Required DOM elements for capabilities UI are missing. Aborting initialization.");
    return;
  }

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      // Clear loading message
      capabilitiesList.innerHTML = "";

      // Populate capabilities list
      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;

        // Create consultants HTML with delete icons
        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants:</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (email) =>
                      `<li><span class="consultant-email">${email}</span><button class="delete-btn" data-capability="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No consultants registered yet</em></p>`;

        // Create elements safely to avoid XSS
        const capabilityTitle = document.createElement('h4');
        capabilityTitle.textContent = name;
        
        const registerBtn = document.createElement('button');
        registerBtn.className = 'register-btn';
        registerBtn.textContent = 'Register Expertise';
        registerBtn.setAttribute('data-capability', name);
        
        capabilityCard.innerHTML = `
          <p>${details.description}</p>
          <p><strong>Practice Area:</strong> ${details.practice_area}</p>
          <p><strong>Industry Verticals:</strong> ${details.industry_verticals ? details.industry_verticals.join(', ') : 'Not specified'}</p>
          <p><strong>Capacity:</strong> ${availableCapacity} hours/week available</p>
          <p><strong>Current Team:</strong> ${currentConsultants} consultants</p>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
        `;
        
        capabilityCard.insertBefore(capabilityTitle, capabilityCard.firstChild);
        capabilityCard.appendChild(registerBtn);

        capabilitiesList.appendChild(capabilityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", handleRegisterClick);
      });
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  // Handle register button click - open modal
  function handleRegisterClick(event) {
    const capability = event.target.getAttribute("data-capability");
    selectedCapabilityInput.value = capability;
    modalCapabilityName.textContent = `Registering for: ${capability}`;
    registerModal.classList.remove("hidden");
    document.getElementById("email").value = "";
    messageDiv.classList.add("hidden");
    
    // Set focus to email input for accessibility
    setTimeout(() => document.getElementById("email").focus(), 100);
  }

  // Helper to close the register modal
  function closeRegisterModal() {
    registerModal.classList.add("hidden");
    selectedCapabilityInput.value = ""; // Clear the selected capability
    registerForm.reset();
    messageDiv.classList.add("hidden");
  }

  // Close modal handlers
  closeModal.addEventListener("click", () => {
    closeRegisterModal();
  });

  registerModal.addEventListener("click", (event) => {
    if (event.target === registerModal) {
      closeRegisterModal();
    }
  });

  // Close modal with Escape key for keyboard accessibility
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Escape" || event.key === "Esc") && !registerModal.classList.contains("hidden")) {
      closeRegisterModal();
    }
  });

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const capability = selectedCapabilityInput.value;

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/register?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();

        // Close modal after successful registration (only on success)
        setTimeout(() => {
          closeRegisterModal();
        }, 2000);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        // Modal stays open so user can see error and retry
      }
    } catch (error) {
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  });

  // Initialize app
  fetchCapabilities();
});
