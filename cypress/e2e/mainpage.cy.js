describe('Main page test', () => {
  it('successfully loads', () => {
    cy.visit('/')
    cy.contains('h1', 'Calendar Admin').should('be.visible')
  })
})