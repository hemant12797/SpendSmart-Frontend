import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection: signalR.HubConnection | undefined;
  private notificationSubject = new Subject<any>();
  public notifications$ = this.notificationSubject.asObservable();

  public startConnection(token: string) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.notificationApi, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));

    this.hubConnection.on('ReceiveNotification', (notification) => {
      this.notificationSubject.next(notification);
    });
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
