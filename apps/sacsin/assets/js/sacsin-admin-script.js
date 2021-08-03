$(document).ready(() => {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active')
    })

    //
    $('[data-display="#response"]').on('click', (e) => {
        $('body').addClass('modal-open')
        $('#response').css('display', 'block')
        setTimeout(() => {
            $('.side-pane').removeClass('loading')
        }, 500)
    })

    // 
    $('#confirm-response').change(() => {
        $('#confirm-response :selected').text() === "Yes" 
        ? $('#test-report').css('display', 'block')
        : $('#test-report').css('display', 'none') 
    })

    // select test report to enter details
    $('[data-display="#select-test-report"]').click((e) => {
        const id = e.target.id // id of the selected test report
        
        // display the sub side pane
        $('#select-test-report').css('display', 'block')
        setTimeout(() => {
            $('.side-select-pane').removeClass('loading')
        }, 500)

        // set the id of the targeted test report on the form
        $('#tr-form').attr('data-for', id)

        // inject the title of the targeted test report
        $('#tr-title').append(e.target.firstChild.textContent)
        
        // listen and enable test report button if all form fields have been provided.
        $('#tr-doc-id').on('input', () => {
            toggleTestReportBtn()
        })
        $('#tr-doc-is').on('input', () => {
            toggleTestReportBtn()
        })
        $('#tr-result').on('input', () => {
            toggleTestReportBtn()
        })
        
        // submit the test report form
        $('#tr-btn').on('click', () => {
            if ($('#tr-btn').hasClass('btn-disabled') == false) {
                // get the actual test report object id stored above
                var _id = $('#tr-form').attr('data-for')
                // populate the data-input attribute of the targeted test report
                $('#'+_id).attr('data-input', JSON.stringify(getTestReportInput().input))
                closeSubSidePane() // close the sub side pane
                denoteTestReport() // denote the test report in question
            }
        })
    })

    // close the sub side pane
    $('.close-sub-side-pane').click(() => {
        closeSubSidePane() // close the sub side pane
    })

    // close the side pane
    $('.close-side-pane').click(() => {
        closeSidePane() // close the side pane
    })


    //==============================================================//

    // gets and returns input from the test report form
    function getTestReportInput() {
        // get form field values.
        let doc_id = $('#tr-doc-id').val()
        let doc_is = $('#tr-doc-is').val()
        let result = $('#tr-result').val()
        // check that all form fields are filled.
        let is_valid = (doc_id != "" && doc_is != "" && result != "")
        let input = {tr_doc_id: doc_id, tr_doc_issuer: doc_is, tr_result: result}
        // return
        return {is_valid: is_valid, input: input}
    }

    // enables or disables the test report button.
    function toggleTestReportBtn() {
        if (getTestReportInput().is_valid) {
            $('#tr-btn').removeClass('btn-disabled')
            $('#tr-btn').addClass('btn-primary')
        } else {
            $('#tr-btn').removeClass('btn-primary')
            $('#tr-btn').addClass('btn-disabled')
        }
    }

    // reset the test report form fields
    function resetTestReportForm() {
        $('#tr-doc-id').val("")
        $('#tr-doc-is').val("")
        $('#tr-result').val("")
    }

    //
    function denoteTestReport() {
        $('[data-input]:not([data-input=""])').css('background', '#eef6fd')
    }

    // closes the sub side pane
    function closeSubSidePane() {
        $('.side-select-pane-backdrop').fadeOut("slow", () => {
            $('.side-select-pane').addClass('loading')
            $('#tr-title').empty() // clear the sub side pane title
            resetTestReportForm() // reset the test report form
            toggleTestReportBtn() // disable the test report button 
        })
    }

    // closes the side pane
    function closeSidePane() {
        $('.side-pane-backdrop').fadeOut("slow", () => {
            $('.side-pane').addClass('loading')
            $('body').removeClass('modal-open')
        })
    }

    function getResponse() {
        let tr_input = []
        let test_reports = [...$('.test-report')]
        test_reports.forEach((test_report) => {
            tr_input.push(test_report.getAttribute('data-input'))
        })
        // console.log(tr_input)
        return tr_input
    }

    // save response
    $('#tr-save').on('click', () => {
        let response = getResponse() // get the response input
        submitResponse(response) // submit the response
        closeSidePane() // close the side pane
    })

    function submitResponse(response) {
        console.log(response)
        $('[data-display="#response"] .alert-danger').empty()
        $('[data-display="#response"] .alert-danger').append('Completed')
        $('[data-display="#response"] .alert-danger').addClass('alert-success')
        $('[data-display="#response"] .alert-danger').removeClass('alert-danger')
    }


    // =================================================== //
    // =================================================== //


    $('[data-display="#subs"]').on('click', () => {
        $('#subs').css('display', 'block')
        setTimeout(() => {
            $('.side-select-pane').removeClass('loading')
        }, 500)
    })

    $('[data-display="#subs-rel"]').on('click', () => {
        $('body').addClass('modal-open')
        $('#subs-rel').css('display', 'block')
        setTimeout(() => {
            $('.side-pane').removeClass('loading')
        }, 500)
    })

    $('[data-display="#migration"]').on('click', () => {
        $('body').addClass('modal-open')
        $('#migration').css('display', 'block')
        setTimeout(() => {
            $('.side-pane').removeClass('loading')
        }, 500)
    })

    $('[data-display="#content-in-migration"]').on('click', () => {
        $('body').addClass('modal-open')
        $('#content-in-migration').css('display', 'block')
        setTimeout(() => {
            $('.side-pane').removeClass('loading')
        }, 500)
    })

    $('[data-display="#product"]').on('click', () => {
        $('body').addClass('modal-open')
        $('#product').css('display', 'block')
        setTimeout(() => {
            $('.side-pane').removeClass('loading')
        }, 500)
    })

    $('[data-display="#object"]').on('click', () => {
        $('body').addClass('modal-open')
        $('#object').css('display', 'block')
        setTimeout(() => {
            $('.side-pane').removeClass('loading')
        }, 500)
    })

    $('a[area-expanded="true"].dropdown-toggle').on('click', function () {
        console.log('Working!!!')
        console.log($('ul.show'))
        $('ul.show').removeClass('show')
        var nextSibling = $(this).next()
            nextSibling.addClass("show")
    });

});