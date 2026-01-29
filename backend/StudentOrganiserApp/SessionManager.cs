using Cassandra;

namespace StudentOrganiserApp.Data
{
    public static class SessionManager
    {
        private static Cassandra.ISession? _session;

        public static Cassandra.ISession GetSession()
        {
            if (_session == null)
            {
                var cluster = Cluster.Builder().AddContactPoint("127.0.0.1").Build();

                _session = cluster.Connect("studentorgapp");
            }

            return _session;
        }
    }
}
