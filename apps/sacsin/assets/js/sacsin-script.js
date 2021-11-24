
window.addEventListener('DOMContentLoaded', event => {

    /**
     * Shrinks the navbar
     * @returns void
     */
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        const searchIcon = document.body.querySelector('.nav-extra-icons .bi-search')
        const navbarLogo = document.querySelector('.navbar-logo')
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
            searchIcon.classList.add('text-white')
            navbarLogo.setAttribute('src', 'assets/img/logo/sacsin_logo_light.png')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
            searchIcon.classList.remove('text-white')
            navbarLogo.setAttribute('src', 'assets/img/logo/sacsin_logo_dark.png')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});