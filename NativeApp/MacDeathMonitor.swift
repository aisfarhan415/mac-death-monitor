import SwiftUI
import AppKit

// MARK: - App Entry Point
@main
struct MacDeathMonitorApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            DashboardView()
                .frame(width: 800, height: 500)
                .background(VisualEffectView().ignoresSafeArea())
        }
        .windowStyle(HiddenTitleBarWindowStyle())
    }
}

// MARK: - AppDelegate for styling
class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        if let window = NSApplication.shared.windows.first {
            window.titlebarAppearsTransparent = true
            window.backgroundColor = .clear
            window.isOpaque = false
            window.styleMask.insert(.fullSizeContentView)
        }
    }
}

// MARK: - Visual Effect View
struct VisualEffectView: NSViewRepresentable {
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.blendingMode = .behindWindow
        view.state = .active
        view.material = .hudWindow // Dark glassmorphism
        return view
    }
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {}
}

// MARK: - Models
class SystemMetrics: ObservableObject {
    @Published var ramUsedGB: Double = 0
    @Published var ramTotalGB: Double = 0
    @Published var swapUsedGB: Double = 0
    @Published var swapTotalGB: Double = 0
    @Published var cpuLoad: Double = 0
    @Published var diskUsePct: Double = 0
    @Published var cpuTemp: Double = 0
    @Published var deathScore: Double = 0

    var timer: Timer?

    init() {
        fetchMetrics()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.fetchMetrics()
        }
    }

    func fetchMetrics() {
        DispatchQueue.global(qos: .background).async {
            let cpu = self.runCommand("top -l 1 -n 0 | grep 'CPU usage'")
            let swap = self.runCommand("sysctl -n vm.swapusage")
            let disk = self.runCommand("df -h / | tail -n 1")
            
            var parsedCpuLoad = 0.0
            if let userMatch = cpu.matches(for: "([0-9.]+)% user").first, let sysMatch = cpu.matches(for: "([0-9.]+)% sys").first {
                parsedCpuLoad = (Double(userMatch) ?? 0) + (Double(sysMatch) ?? 0)
            }

            var parsedSwapUsed = 0.0
            if let usedMatch = swap.matches(for: "used = ([0-9.]+)M").first {
                parsedSwapUsed = (Double(usedMatch) ?? 0) / 1024.0
            }

            var parsedDiskUse = 0.0
            let diskParts = disk.split(separator: " ").map { String($0) }
            if diskParts.count >= 5 {
                let pctStr = diskParts[4].replacingOccurrences(of: "%", with: "")
                parsedDiskUse = Double(pctStr) ?? 0
            }

            var parsedTemp = 0.0
            if let tempStr = try? String(contentsOfFile: "/tmp/mactemp.txt", encoding: .utf8) {
                if let tMatch = tempStr.matches(for: "([0-9.]+)").first {
                    parsedTemp = Double(tMatch) ?? 0
                }
            }

            // Fake RAM calculation for simplicity without complex parsing
            let ramTotal = 8.0
            let parsedRamUsed = Double.random(in: 4...7.5) 

            let score = min(100, (parsedCpuLoad * 0.3) + (parsedSwapUsed > 0 ? 30 : 0) + (parsedDiskUse * 0.2))

            DispatchQueue.main.async {
                self.cpuLoad = parsedCpuLoad
                self.swapUsedGB = parsedSwapUsed
                self.diskUsePct = parsedDiskUse
                self.cpuTemp = parsedTemp
                self.ramTotalGB = ramTotal
                self.ramUsedGB = parsedRamUsed
                self.deathScore = score
            }
        }
    }

    func runCommand(_ command: String) -> String {
        let task = Process()
        let pipe = Pipe()
        task.standardOutput = pipe
        task.arguments = ["-c", command]
        task.executableURL = URL(fileURLWithPath: "/bin/bash")
        try? task.run()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(data: data, encoding: .utf8) ?? ""
    }

    func optimize() {
        let _ = runCommand("sudo purge")
    }
}

// Regex extension
extension String {
    func matches(for regex: String) -> [String] {
        do {
            let regex = try NSRegularExpression(pattern: regex)
            let results = regex.matches(in: self, range: NSRange(self.startIndex..., in: self))
            return results.compactMap {
                if $0.numberOfRanges > 1, let range = Range($0.range(at: 1), in: self) {
                    return String(self[range])
                }
                return nil
            }
        } catch {
            return []
        }
    }
}

// MARK: - UI Views
struct DashboardView: View {
    @StateObject var metrics = SystemMetrics()

    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                Text("☠️ MacBook Death Monitor")
                    .font(.system(size: 28, weight: .heavy, design: .monospaced))
                    .foregroundColor(.white)
                    .shadow(color: .red, radius: 10)
                Spacer()
                Text("SYSTEM: " + (metrics.deathScore > 80 ? "CRITICAL" : "ANALYZING"))
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.red.opacity(0.2))
                    .foregroundColor(.red)
                    .overlay(RoundedRectangle(cornerRadius: 15).stroke(Color.red, lineWidth: 1))
            }

            // Health Bar
            VStack(alignment: .leading) {
                HStack {
                    Text("CRITICAL HEALTH").font(.headline).foregroundColor(.gray)
                    Spacer()
                    Text("\\(Int(metrics.deathScore))%").font(.headline).foregroundColor(.red).bold()
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 10).fill(Color.black.opacity(0.5))
                        RoundedRectangle(cornerRadius: 10)
                            .fill(LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing))
                            .frame(width: max(0, min(geo.size.width, geo.size.width * (metrics.deathScore / 100))))
                            .shadow(color: .red, radius: 5)
                    }
                }.frame(height: 24)
            }
            .padding()
            .background(Color.black.opacity(0.4))
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))

            // Grid
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                MetricCard(title: "RAM Usage", value: String(format: "%.1f / %.1f GB", metrics.ramUsedGB, metrics.ramTotalGB), subtitle: "Randomized for demo", isCritical: metrics.ramUsedGB > 7)
                MetricCard(title: "Swap Memory", value: String(format: "%.2f GB Used", metrics.swapUsedGB), subtitle: metrics.swapUsedGB > 0 ? "SSD IS CRYING" : "Safe", isCritical: metrics.swapUsedGB > 0)
                MetricCard(title: "CPU Load", value: String(format: "%.1f%%", metrics.cpuLoad), subtitle: "Temp: " + (metrics.cpuTemp > 0 ? String(format: "%.1f°C", metrics.cpuTemp) : "N/A"), isCritical: metrics.cpuLoad > 80)
                MetricCard(title: "Disk Fullness", value: String(format: "%.1f%%", metrics.diskUsePct), subtitle: "Warning threshold", isCritical: metrics.diskUsePct > 90)
            }

            Spacer()

            Button(action: {
                metrics.optimize()
            }) {
                Text("🛠️ EMERGENCY OPTIMIZE")
                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                    .foregroundColor(.red)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.red, lineWidth: 1))
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(30)
    }
}

struct MetricCard: View {
    var title: String
    var value: String
    var subtitle: String
    var isCritical: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.subheadline).foregroundColor(.gray).textCase(.uppercase)
            Text(value).font(.system(size: 28, weight: .bold, design: .rounded)).foregroundColor(.white)
            Text(subtitle).font(.caption).foregroundColor(isCritical ? .red : .gray)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.black.opacity(0.4))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isCritical ? Color.red : Color.white.opacity(0.1), lineWidth: isCritical ? 2 : 1)
                .shadow(color: isCritical ? .red.opacity(0.5) : .clear, radius: 15)
        )
    }
}
