import SwiftUI

struct JoinInviteView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var services: ServiceContainer
    @EnvironmentObject private var toastCenter: ToastCenter
    @StateObject private var vm = JoinInviteViewModel()
    @State private var teamName: String = ""
    
    let token: String
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if vm.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .padding()
                } else if let invite = vm.inviteDetails {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Join League")
                            .font(Theme.titleFont())
                            .foregroundColor(Theme.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        CardView {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("League: \(invite.leagueName)")
                                    .font(Theme.headingFont())
                                    .foregroundColor(Theme.textPrimary)
                                
                                Text("Teams: \(invite.teamCount) / \(invite.maxTeams)")
                                    .font(Theme.bodyFont())
                                    .foregroundColor(Theme.textSecondary)
                                
                                if invite.teamCount >= invite.maxTeams {
                                    Text("This league is full")
                                        .font(Theme.bodyFont())
                                        .foregroundColor(.red)
                                        .padding(.top, 8)
                                }
                            }
                        }
                        
                        if invite.teamCount < invite.maxTeams {
                            CardView {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Team Name")
                                        .font(Theme.headingFont())
                                        .foregroundColor(Theme.textPrimary)
                                    
                                    TextField("Enter your team name", text: $teamName)
                                        .textFieldStyle(.plain)
                                        .padding(12)
                                        .background(Theme.surface)
                                        .cornerRadius(8)
                                    
                                    Button {
                                        Task {
                                            await vm.acceptInvite(token: token, teamName: teamName)
                                            if let error = vm.errorMessage {
                                                toastCenter.show(error, type: .error)
                                            } else if vm.inviteAccepted, let result = vm.acceptResult {
                                                toastCenter.show("Successfully joined the league!", type: .success)
                                                // Clear pending invite token
                                                appState.pendingInviteToken = nil
                                                // Refresh leagues - the app should load the new league
                                                // For now, we'll just navigate back to dashboard
                                                // In a full implementation, we'd refresh leagues and navigate to the new league
                                            }
                                        }
                                    } label: {
                                        Text(vm.isAccepting ? "Joining..." : "Join League")
                                            .bold()
                                            .frame(maxWidth: .infinity)
                                            .padding()
                                            .background(Theme.accent)
                                            .foregroundColor(.white)
                                            .cornerRadius(12)
                                    }
                                    .disabled(vm.isAccepting || teamName.trimmingCharacters(in: .whitespaces).isEmpty)
                                }
                            }
                        }
                    }
                    .padding(16)
                } else if let error = vm.errorMessage {
                    VStack(spacing: 16) {
                        Text("Invalid Invite")
                            .font(Theme.titleFont())
                            .foregroundColor(Theme.textPrimary)
                        
                        Text(error)
                            .font(Theme.bodyFont())
                            .foregroundColor(Theme.textSecondary)
                            .multilineTextAlignment(.center)
                        
                        Button {
                            appState.pendingInviteToken = nil
                        } label: {
                            Text("Back to Dashboard")
                                .bold()
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Theme.accent)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(16)
                }
            }
        }
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
        )
        .task {
            vm.inviteService = services.inviteService
            await vm.loadInvite(token: token)
        }
    }
}

@MainActor
final class JoinInviteViewModel: ObservableObject {
    @Published var inviteDetails: InviteDetails? = nil
    @Published var isLoading: Bool = false
    @Published var isAccepting: Bool = false
    @Published var errorMessage: String? = nil
    @Published var inviteAccepted: Bool = false
    @Published var acceptResult: AcceptInviteResult? = nil
    
    var inviteService: InviteService?
    
    func loadInvite(token: String) async {
        isLoading = true
        defer { isLoading = false }
        do {
            inviteDetails = try await inviteService?.getInviteByToken(token: token)
        } catch {
            errorMessage = "Invalid or expired invite link"
        }
    }
    
    func acceptInvite(token: String, teamName: String) async {
        guard !teamName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        isAccepting = true
        defer { isAccepting = false }
        do {
            let result = try await inviteService?.acceptInvite(token: token, teamName: teamName.trimmingCharacters(in: .whitespaces))
            acceptResult = result
            inviteAccepted = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

