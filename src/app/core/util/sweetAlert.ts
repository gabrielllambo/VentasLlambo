import Swal, { SweetAlertIcon } from 'sweetalert2';

export default {

    input(title: string, callback: (inputValue: string | null) => void) {
        Swal.fire({
            title: title,
            input: 'text',
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#F88101',
            cancelButtonColor: '#81898b',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Si'
        }).then((result) => {
            if (result.isConfirmed) {
                callback(result.value);
            }
        });
    },

    confirm(message: string, iconAlert: SweetAlertIcon, callback: () => void) {
        Swal.fire({
            title: 'Confirmación',
            text: message,
            icon: iconAlert,
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#81898b',
            cancelButtonText: 'No',
            confirmButtonText: 'Si'
        }).then((result) => {
            if (result.isConfirmed) {
                callback();
            }
        });
    },
    success(title, mensaje: string) {
        Swal.fire(title, mensaje, 'success');
    },
    warning(mensaje: string) {
        Swal.fire('Mensaje', mensaje, 'warning');
    },
    error(mensaje: string) {
        Swal.fire('Mensaje', mensaje, 'error');
    }
};

