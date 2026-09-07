import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-blue-600 mb-6">Portal de Soporte de TI</h1>
      
      <!-- Formulario para crear Ticket -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 class="text-xl font-semibold mb-4">Crear Nuevo Ticket</h2>
        <input [(ngModel)]="newTicket.title" placeholder="Título del problema (ej. No hay internet)" class="w-full mb-3 p-2 border rounded">
        <textarea [(ngModel)]="newTicket.description" placeholder="Describe el problema en detalle..." class="w-full mb-3 p-2 border rounded"></textarea>
        <button (click)="createTicket()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Enviar Ticket
        </button>
      </div>

      <!-- Lista de Tickets -->
      <div>
        <h2 class="text-xl font-semibold mb-4">Mis Tickets Activos</h2>
        <div *ngFor="let ticket of tickets" class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 mb-3">
          <h3 class="font-bold">{{ ticket.title }}</h3>
          <p class="text-gray-600 text-sm mb-2">{{ ticket.description }}</p>
          <div class="flex justify-between text-xs text-gray-500">
            <span>Reportado por: {{ ticket.author?.name }}</span>
            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{{ ticket.status }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  http = inject(HttpClient);
  tickets: any[] = [];
  
  newTicket = { title: '', description: '', authorId: 1 }; 

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.http.get('http://localhost:3000/api/tickets').subscribe((data: any) => {
      this.tickets = data;
    });
  }

  createTicket() {
    this.http.post('http://localhost:3000/api/tickets', this.newTicket).subscribe(() => {
      alert('Ticket creado con éxito');
      this.newTicket.title = '';
      this.newTicket.description = '';
      this.loadTickets(); // Recargar la lista
    });
  }
}