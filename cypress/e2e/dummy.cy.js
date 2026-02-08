describe('Dummy Cypress Test', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.contains('OpenStreetMap'); // Adjust to match something visible on your homepage
  });

  it('should have a map', () => {
    cy.visit('/');
    cy.get('#map').should('exist');
  });
});


// describe('Show pan-to control when GPS signal is available', () => {
//   it('should display the pan-to control when GPS is available', () => {
//     cy.visit('/');

//     // Simulate GPS availability
//     cy.window().then((win) => {
//       // Assuming your app has a method to simulate GPS signal
//       if (win.simulateGPSSignal) {
//         win.simulateGPSSignal(true);
//       }
//     });

//     // Check if the pan-to control is visible
//     cy.get('.pan-button').should('be.visible');
//   });
// });

describe('Show pan-to control when GPS signal is available', () => {
  it('should show pan-to control when GPS signal is available', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Mock geolocation API
        cy.stub(win.navigator.geolocation, 'getCurrentPosition')
          .callsFake((success) => {
            success({
              coords: {
                latitude: 35.0,
                longitude: 135.0,
                accuracy: 10,
              }
            });
          });
        cy.stub(win.navigator.geolocation, 'watchPosition')
          .callsFake((success) => {
            console.log('Mock watchPosition called');
            success({
              coords: {
                latitude: 35.0,
                longitude: 135.0,
                accuracy: 10,
              }
            });
            return 1; // mock watch id
          });
      }
    });
    // wait for the map to load and GPS to be processed
    cy.wait(500);
    cy.contains('.pan-button');
    cy.get('.pan-button').should('be.visible');
  });
});

describe('Hide pan-to control when GPS signal is unavailable', () => {
  it('should hide pan-to control when GPS signal is unavailable', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Mock geolocation API to fail
        cy.stub(win.navigator.geolocation, 'getCurrentPosition')
          .callsFake((success, error) => {
            error({ code: 1, message: 'User denied Geolocation' });
          });
        cy.stub(win.navigator.geolocation, 'watchPosition')
          .callsFake((success, error) => {
            console.log('Mock watchPosition called');
            error({ code: 1, message: 'User denied Geolocation' });
            return 1; // mock watch id
          });
      }
    });
    // wait for the map to load and GPS to be processed
    cy.wait(500);

    cy.get('.pan-button').should('not.exist');
  });
});
