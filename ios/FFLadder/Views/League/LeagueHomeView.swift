import SwiftUI

struct LeagueHomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: ServiceContainer
    @StateObject private var vm = LeagueHomeViewModel()
    @State private var inviteEmail: String = ""
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(appState.selectedLeague?.name ?? "League")
                    .font(Theme.titleFont())
                    .foregroundColor(Theme.textPrimary)
                
                // Standings placeholder
                CardView {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Standings")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        ForEach(0..<8, id: \.self) { idx in
                            HStack {
                                Text("#\(idx + 1)")
                                    .font(Theme.bodyFont().weight(.semibold))
                                Text("Team \(idx + 1)")
                                    .foregroundColor(Theme.textSecondary)
                                Spacer()
                                // Promotion/Relegation indicator placeholder
                                Pill(text: idx < 2 ? "Promote" : (idx >= 6 ? "Relegate" : ""))
                            }
                            .foregroundColor(Theme.textPrimary)
                        }
                    }
                }
                
                // Invite Managers
                CardView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Invite Managers")
                            .font(Theme.headingFont())
                            .foregroundColor(Theme.textPrimary)
                        HStack {
                            TextField("email@domain.com", text: $inviteEmail)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                                .padding(10)
                                .background(Theme.surface)
                                .cornerRadius(8)
                            Button {
                                Task { 
                                    await vm.sendInvite(email: inviteEmail)
                                    if vm.errorMessage == nil {
                                        inviteEmail = ""
                                    }
                                }
                            } label: {
                                Text("Send")
                                    .bold()
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 10)
                                    .background(Theme.accent)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }
                        
                        Divider()
                            .padding(.vertical, 4)
                        
                        Button {
                            Task { await vm.createInviteLink() }
                        } label: {
                            HStack {
                                Image(systemName: "link")
                                Text("Create & Share Invite Link")
                            }
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.surfaceElevated)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .sheet(item: Binding(
                            get: { vm.inviteLinkToken.map { ShareItem(url: vm.getInviteURL(token: $0)!) } },
                            set: { _ in vm.inviteLinkToken = nil }
                        )) { item in
                            ShareSheet(activityItems: [item.url])
                        }
                        
                        if !vm.invites.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Pending Invites")
                                    .font(Theme.bodyFont().weight(.semibold))
                                ForEach(vm.invites) { invite in
                                    HStack {
                                        Text(invite.email)
                                        Spacer()
                                        Pill(text: invite.status.capitalized)
                                    }
                                    .foregroundColor(Theme.textPrimary)
                                }
                            }
                        }
                    }
                }
                
                // Settings link placeholder
                NavigationLink(destination: Text("League Settings (Placeholder)")) {
                    Text("League Settings")
                        .bold()
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Theme.surfaceElevated)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }
            .padding(16)
        }
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .task {
            vm.appState = appState
            vm.inviteService = services.inviteService
            await vm.loadInvites()
        }
        .refreshable {
            await vm.loadInvites()
        }
    }
}


